/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: index.js
* @Last modified time: 2017-01-29T17:53:53-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



(function() {
    'use strict';

    /*
     * function used to retrieve a workflow for a given office.
     */
    var retrieveWorkflow = function(req, workflowName) {
        var getWorkflowPromise = req.app.db.models.AppropSettings.findOne({
                office: req.user.office
            }).populate('workflows').exec() //then
            .then(function(settings) {
                var workflow = settings.lookupWorkflow(workflowName);

                return workflow;
            })
            .catch(function(err) {
                return Promise.reject(err);
            });

        return getWorkflowPromise;
    };

    var getStage = function(req, workflowName, stage, callback) {


        var getStagePromise = retrieveWorkflow(req, workflowName) //then
            .then(function(workflow) {
                var steps = [];

                workflow.steps.forEach(function(step) {
                    if (step.stage === stage) {
                        steps.push(step);
                    }
                });

                return steps;
            });

        if (callback) {
            getStagePromise.then(callback);
        }

        getStagePromise.catch(function(err) {
            //TODO (ajh): handle error.
            return Promise.reject(err);
        });

        return getStagePromise;
    };

    exports.getStage = function(req, res, next) {

        if (!req.params.flow) {
            res.status(400).send('missing flow param');
            return;
        }

        if (!req.query.stage) {
            res.status(400).send('missing stage param');
            return;
        }

        getStage(req, req.params.workflowName, req.query.stageNumber) //then
            .then(function(stage) {
                return res.json(stage);
            });
    };

    exports.getStepById = function(req, res, next) {

        if (!req.query.step) {
            res.status(400).send('missing step param');
            return;
        }

        var itemId = req.query.step;

        req.app.db.models.WorkflowStep.findById(itemId).exec() //then
            .then(function(step) {
                if (!step) {
                    return res.status(400).send('no step found with ID: ' + itemId);
                }
                return res.json(step);
            })
            .catch(function(err) {
                res.status(500).send('error accessing workflow items');
                return;
            });
    };

    exports.getWorkflow = function(req, res, next) {
        //returns the complete workflow for the requester's office

        //TODO: validate request.

        var workflowPromise = retrieveWorkflow(req, req.params.workflowName) //then
            .then(function(workflow) {
                return res.json(workflow);
            }).catch(function(err) {
                return res.status(400).send(err);
            });

        return workflowPromise;
    };

    //ajh
    //req.app.actionHandler
    function runActions(actionHandler, currentStage, letter) {
        actionHandler.runActions(currentStage, letter);
    }

    /*
     * StepOperationRequestInfo is essentially the same pattern as express uses with the req object.
     * It wraps the express req object, and adds a few fields for storing retrieved mongoose objects.
     * In the future, these fields might get stored dirctly into the req object, but this approach
     * provides some clarity of field names and classifies stepOperationRequests as containing letterId & stepId.
     *
     */

    function StepOperationRequestInfo(req, letterId, stepId, letter, targetStep) {
        this.letterId = letterId;
        this.stepId = stepId;

        sanitizeStepOperationRequest(letterId, stepId, letter, targetStep);

        this.req = req;

        return this;
    }

    function sanitizeStepOperationRequest(letterId, stepId, letter, targetStep) {
        //In the current system, this sanitization function isn't really necessary because requests are wrapped
        // server side in our own custom logic. Sanitization becomes more of an issue when we rely on req parser middleware.

        var isSanitized = true;

        if (letter || targetStep) {
            isSanitized = false;
            throw 'Error, possibly malicious query from client. StepOperationRequests should not contain a populated letter or targetStep.';
        }

        if (typeof letterId !== 'string' || typeof stepId !== 'string') {
            isSanitized = true;
            throw 'StepOperationRequest invalid because letterId and/or stepId are not strings.';
        }

        return true;
    }

    var extractTargetStepFromWorkflow = function(steps) {
        var targetStep = steps.filter(function(possibleMatch) {
            return (possibleMatch._id === stepId);
        });

        if (!targetStep || targetStep.length === 0 || targetStep.length > 1) {
            var errorMessage = 'Error while retrieving desired step: ';
            if (targetStep) {
                errorMessage = errorMessage + 'Invalid workflowId, number of eligible stages: ' + targetStep.length;
            } else {
                errorMessage = errorMessage + 'Could not find any steps by requested id: ' + stepId;
            }

            throw errorMessage;
        }

        targetStep = targetStep[0];

        return targetStep;
    };

    var validatePermissions = function(sor) {
        //role is correct
        if (!sor.targetStep.permittedAccess.groups) {
            //TODO
        }

        //check if user is permitted access.
    };

    var validateStepOperationRequest = function(sor) {
        //sor is a StepOperationRequestInfo object
        if (!StepOperationsRequestInfo.isPrototypeOf(sor)) {
            return Promise.reject('Bad request object type on server side.');
        }

        var validatePromise = sor.req.app.db.models.LetterItem.findOne({
                _id: letterId
            }).populate('workflow workflow.steps').exec()
            .then(function(letter) {
                // populates sor.letter, sor.targetStep
                // validates sor.targetStep

                sor.letter = letter;
                sor.targetStep = extractTargetStepFromWorkflow(letter.workflow.steps);

                validatePermissions(sor);

                return sor;
            })
            .catch(function(err) {
                return Promise.reject(err);
            });

        return validatePromise;
    };

    var actions = {
        ADVANCE: 'ADVANCE',
        UNDO: 'UNDO'
    };

    exports.finishWorkflowStep = function(req, res, next) {
        var letterId = req.body.letter._id || req.body.letter;
        var stepId = req.body.workflowStep._id || req.body.workflowStep;

        var stepOperationRequest = new StepOperationRequestInfo(req, letterId, stepId, {}, {});
        var finishTag = req.app.db.models.WorkflowStep.progressStates.FINISHED;

        var finishPromise = validateStepOperationRequest(stepOperationRequest) //then
            .then(function(sor) {
                return sor.workflow.addProgress(sor.req.body.user, sor.req.body.targetStep, finishTag);
            })
            .then(function(finishedWorkflowStep) {
                return res.json(sor.workflow);
            });

        //will resolve into the completed workflowStep.
        return finishPromise;
    };

    exports.undoWorkflowStep = function(req, res, next) {
        var letterId = req.body.letter._id || req.body.letter;
        var stepId = req.body.workflowStep._id || req.body.workflowStep;

        var stepOperationRequest = new StepOperationRequestInfo(req, letterId, stepId, {}, {});

        return undoStepState(stepOperationRequest);
    };

}());
