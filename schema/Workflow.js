/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: Workflow.js
* @Last modified time: 2017-01-27T17:08:46-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



var Promise = require('bluebird');

exports = module.exports = function(app, mongoose) {
    var purposes = {
        template: 'TEMPLATE',
        instance: 'INSTANCE'
    };

    /*
     *
     *
     *
     * previousTemplates - only to be used if the purpose is TEMPLATE. Stores previous versions of the template. See Maintain Head note.
     * previousStates - only to be used if the purpose is INSTANCE. Stores previous workflow states. See Maintain Head note.
     *
     *
     * NOTE (Maintain Head) : Workflow is a recursive schema, where previous states are stored in an array Workflow pointers. However, we don't want to
     * update the references everytime we change the state. Therefore, we make a clone of the Workflow object, and store a pointer to the clone. This
     * way, the current workflow state is always accessed using the same ObjectId. Previous states can be accessed through the current state.
     *
     *  Maintain Head (for instances, same is true for templates):
     *		1. Retrieve Workflow Instance
     *		2. Clone Workflow Instance
     *		3. Make changes to current instance (eg. currentWorkflow)
     *		4. If changes are successful: clone.save()  || Else : do not persist clone or currentWorkflow
     *		5. currentWorkflow.previousStates.add(clone._id)
     *		6. currentWorkflow.save();
     *
     *		Important Concerns: possible database conflict if items are manipulated at the same time -- would be important to avoid here.
     *
     */

    var Workflow = new mongoose.Schema({
        name: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },

        steps: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkflowStep'
        }],
        purpose: {
            type: String,
            default: purposes.instance
        },

        version: {
            type: String,
            default: '0.1'
        },
        activeDates: {
            start: {
                type: Date,
                default: Date.now()
            },
            end: {
                type: Date,
                default: null
            }
        },

        previousTemplates: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workflow'
        }],
        previousStates: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workflow'
        }],

        //Important:
        //temporaryClone: {type: Workflow} (NOTE: this is a virtual field that is added below)

    });

    //Add a convenience fielld for keeping track of a temporary clone during modification operations. the clone will then be persisted as a previous state or template.

    Workflow.virtual('temporaryClone').get(function() {
        return this.__temporaryClone;
    }).set(function(temporaryClone) {
        this.__temporaryClone = temporaryClone;
    });

    //Instance method for cloning the current workflow into the virtual temporaryClone field.
    //Goal: Create a persisted Workflow object that holds the current state of the workflow. A pointer to this state will be kept in an array in the Workflow head state.
    Workflow.methods.populateClone = function(workflowSchema) {
        var self = this;

        //This weird little serialize/deserialize function makes a clone of _id instead of a deep pointer, so we can delete self._id and save the value in originalId.
        var originalId = JSON.parse(JSON.stringify(self._id));

        delete self._id;

        self.model('Workflow')
            .insert(self)
            .then(function(clone) {
                self.__temporaryClone = clone;
                self._id = originalId;

                return self;
            })
            .catch(function(err) {
                return 'Unable to retrieve workflow with a clone';
            });
    };

    /*
     *
     */
    Workflow.methods.buildInstanceFromTemplate = function() {
        if (this.purpose !== purposes.template) {
            throw 'Attempted to build a workflow instance from a non-template';
        }

        /*
         * Create a new object with a different Id than this template.
         * Then restore the id to this template.
         */
        var cacheId = JSON.parse(JSON.stringify(this._id));
        this.isNew = true;
        this._id = mongoose.Types.ObjectId();
        this.purpose = purposes.instance;
        this.previousTemplates = [];

        var createdInstance = this;

        var createdInstancePromise;

        /*
         * Build an array of promises (stepInstancePromises), and then execute
         */

        var stepInstancePromises = [];
        for (var idx = 0; idx < createdInstance.steps.length; idx++) {
            stepInstancePromises.push(
                app.db.models.WorkflowStep.findOne(createdInstance.steps[idx]) //...
                .exec() //then
                .then(
                    function(stepTemplate) {
                        var stepInstance = stepTemplate.buildInstanceFromTemplate();
                        return stepInstance;
                    }
                )
            );
        }

        /*
         * Once all the step instances have been created, perform a few actions and then save them.
         */

        createdInstancePromise = Promise.all(stepInstancePromises) //then
            .then(function(stepInstances) {
                var stageZeroSteps = [];

                createdInstance.steps = stepInstances;

                createdInstance.steps.forEach(function(step) {
                    if (step.stage === 0) {
                        step.start();
                        step.finish();

                        stageZeroSteps.push(step.save());
                    }
                });

                return Promise.all(stageZeroSteps);
            }).then(function(stageZeros) {
                return createdInstance.save();
            }).catch(function(err) {
                console.log(err);
                return Promise.reject(err);
            });

        return createdInstancePromise;
    };

    /*
     * Convenience function for finding the workflow of a given name
     */
    Workflow.methods.lookup = function(lookupName) {
        var lookup = {};

        for (var i = 0, len = this.workflows.length; i < len; i++) {
            lookup[this.workflows[i].name] = this.workflows;
        }

        return lookup[lookupName];
    };

    Workflow.methods.addProgress = function(user, step, stateTag) {
        var self = this;
        var checkIfStageCompleted = false;

        switch (stateTag) {
            case 'started':
                checkIfStageCompleted = false;
                step.start(user);
                break;
            case 'finished':
                checkIfStageCompleted = true;
                step.finish(user);
                break;
            case 'skipped':
                checkIfStageCompleted = true;
                step.skip(user);
                break;
            default:
                throw 'Unknown stateTag';
        }

        if (checkIfStageCompleted) {
            if (this.checkIfStageComplete(this.stage)) {
                this.unlockNextStage(user, this.stage);
            }
        }

        //TODO: steps aren't being persisted yet.

        var progressPromise = step.save() //then
            .then(function(updatedStep) {
                return self;
            });

        return progressPromise;
    };

    function stepIsCompleted(step) {
        return (step.progress.finished.hasOccurred || step.progress.skipped.hasOccurred);
    }

    function checkIfStageComplete(stage) {
        var isComplete = true;

        steps.forEach(function(step) {
            if (step.stage === stage) {
                isComplete = isComplete && stepIsCompleted(step);
            }
        });

        return isComplete;
    }

    function unlockNextStage(user, stage) {
        this.steps.forEach(function(step) {
            if (step.stage === stage) {
                step.start(user);
            }
        });
    }

    if (app && app.db) {
        app.db.model('Workflow', Workflow);
    } else if (mongoose) {
        return mongoose.model('Workflow', Workflow);
    }

};
