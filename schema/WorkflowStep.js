/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: WorkflowStep.js
* @Last modified time: 2017-01-27T17:09:04-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports = module.exports = function(app, mongoose) {
    var purposes = {
        template: 'TEMPLATE',
        instance: 'INSTANCE'
    };

    var WorkflowStep = new mongoose.Schema({
        name: String,
        parentWorkflow: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workflow'
        }],
        stage: Number,
        description: String,

        permittedAccess: [{
            groups: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group'
            },
            users: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }],

        purpose: {
            type: String,
            default: purposes.instance
        },

        actions: [String],
        isUndoable: {
            type: Boolean,
            default: true
        },

        progress: {
            before: {
                hasOccurred: {
                    type: Boolean,
                    default: true
                },
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                timestamp: {
                    type: Date,
                    default: Date.now()
                }
            },
            started: {
                hasOccurred: {
                    type: Boolean,
                    default: false
                },
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                timestamp: {
                    type: Date,
                    default: null
                }
            },
            finished: {
                hasOccurred: {
                    type: Boolean,
                    default: false
                },
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                timestamp: {
                    type: Date,
                    default: null
                }
            },
            skipped: {
                hasOccurred: {
                    type: Boolean,
                    default: false
                },
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                timestamp: {
                    type: Date,
                    default: null
                }
            },
        },

        assigned: {
            user: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            }],
            timestamp: [{
                type: Date,
                default: null
            }],
        }
    });

    //progressKeys is a convenience array for quickly pulling field names.
    //progressStates is an enumeration of the state names, for slightly safer comparison checks.
    var progressKeys = ['before', 'started', 'finished', 'assigned', 'skipped'];
    var progressStates = {
        BEFORE: 'before',
        STARTED: 'started',
        FINISHED: 'finished',
        ASSIGNED: 'assigned',
        SKIPPED: 'skipped'
    };

    WorkflowStep.methods.isKnownState = function(state) {
        state = state.toLowerCase();
        return progressKeys.includes(state);
    };

    WorkflowStep.methods.progressContains = function(state) {
        var isContained = false;

        if (progressKeys.includes(state.toLowerCase())) {
            isContained = this.progress[state].hasOccurred;
        }

        return isContained;
    };

    WorkflowStep.methods.start = function(user) {
        this.addProgress(user, progressStates.STARTED);
    };

    WorkflowStep.methods.finish = function(user) {
        this.addProgress(user, progressStates.FINISHED);
    };

    WorkflowStep.methods.skip = function(user) {
        this.addProgress(user, progressStates.SKIPPED);
    };

    WorkflowStep.methods.addProgress = function(user, state) {
        var isAdded;
        var errorMessage = isValidNextState(this, state);

        if (!errorMessage) {

            this.progress[state].user = user;
            this.progress[state].timestamp = Date.now();
            this.progress[state].hasOccurred = true;

            isAdded = true;
        } else {
            isAdded = false;
            throw errorMessage;
        }

        return isAdded;
    };

    //assignUsers
    //adds users to the list of assignees. Does NOT persist.
    WorkflowStep.methods.assignUsers = function(users) {
        users = [].concat(users);

        this.assigned = this.assigned.concat(users);

        for (var n = 0; n < users.length; n++) {
            this.assigned.timestamp.concat(Date.now());
        }

        return true;
    };

    //unassignUsers
    //removes users from the list of assignees. Does NOT persist.
    WorkflowStep.methods.unassignUsers = function(users) {
        users = [].concat(users);

        //TODO: Remove assigned and timestamps accordingly.
    };

    WorkflowStep.methods.removeProgress = function(state, user) {
        var isRemoved;
        var errorMessage = isReadyToUndo(this, state);

        if (!errorMessage) {

            this.progress[state].user = null;
            this.progress[state].timestamp = Date.now();
            this.progress[state].hasOccurred = false;

            isRemoved = true;
        } else {
            isRemoved = false;
            throw 'Tried to remove progress that does not exist.';
        }

        return isRemoved;
    };

    function isValidNextState(step, nextState) {
        var errorMessage = '';

        if (!(step.isKnownState(nextState))) {
            throw 'Unknown workflow step state request: ' + nextState;
        }

        if (step.progressContains(nextState)) {
            errorMessage = errorMessage + 'Tried to add progress that was already completed. \n';
        }

        var validationFunction;

        switch (nextState) {
            case progressStates.STARTED:
                validationFunction = isReadyToStart;
                break;
            case progressStates.FINISHED:
                validationFunction = isReadyToFinish;
                break;
            case progressStates.SKIPPED:
                validationFunction = isReadyToSkip;
                break;
            default:
                //No validation required for the desired nextState.
                validationFunction = function() {
                    return true;
                };
                break;
        }

        errorMessage = errorMessage + validationFunction(step);

        return errorMessage;
    }

    var isReadyToStart = function(step) {
        var errorMessage = '';

        if (!step.progressContains(progressStates.BEFORE)) {
            errorMessage = 'WorkflowStep needs to have a BEFORE state before it can be STARTED';
        }

        return errorMessage;
    };

    var isReadyToFinish = function(step) {
        var errorMessage = '';

        if (!step.progressContains(progressStates.STARTED)) {
            errorMessage = 'WorkflowStep needs to be STARTED before it can be FINISHED';
        }

        return errorMessage;
    };

    var isReadyToSkip = function(step) {
        var errorMessage = '';

        if (!step.progressContains(progressStates.STARTED)) {
            errorMessage = 'WorkflowStep needs to be STARTED before it can be SKIPPED';
        }

        return errorMessage;
    };

    var isReadyToUndo = function(step, state) {
        var errorMessage = '';

        if (!step.progressContains(state)) {
            errorMessage = errorMessage + 'Tried to undo progress that was not already completed \n';
        }

        if (!(step.progressContains(progressStates.STARTED) || step.progressContains(progressStates.FINISHED) || step.progressContains(progressStates.SKIPPED))) {
            errorMessage = 'WorkflowStep needs to be STARTED, FINISHED, or SKIPPED before there is anything to UNDO';
        }

        return errorMessage;
    };

    /*
     *
     */

    WorkflowStep.methods.buildInstanceFromTemplate = function() {
        if (this.purpose !== purposes.template) {
            throw 'Attempted to build a workflowStep instance from a non-template';
        }

        /*
         * Create a new object with a different Id than this template.
         * Then restore the id to this template.
         */
        var cacheId = JSON.parse(JSON.stringify(this._id));
        this.isNew = true;
        this._id = mongoose.Types.ObjectId();
        this.purpose = purposes.instance;

        var createdInstancePromise = this.save();
        return createdInstancePromise;
    };

    if (app && app.db) {
        app.db.model('WorkflowStep', WorkflowStep);
    } else if (mongoose) {
        return mongoose.model('WorkflowStep', WorkflowStep);
    }
};
