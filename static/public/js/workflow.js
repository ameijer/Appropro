/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: workflow.js
* @Last modified time: 2017-01-29T18:01:27-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



/**
 * Tools for adding a workflow diagram to a page.
 */

var WorkflowDiagram = (function(oConfig) {

    var mLetter;

    var self = this;

    var workflowTableStructure = '<table class="workflow-table">' +
        '<tr>' +
        '<th>Stage</th>' +
        '<th>Status</th>' +
        '<th>Actions</th>' +
        '</tr>' +
        '</table>';

    function finishStep(finishedStep) {
        var finishStepPost = $.ajax({
            type: "POST",
            dataType: "json",
            url: "/workflow/step/finish",
            data: finishedStep
        });

        return completeStagePost;
    }

    function undoStep(undoStep) {
        var undoStepPost = $.ajax({
            type: "POST",
            dataType: "json",
            url: "/workflow/step/finish",
            data: undoStep
        });

        return undoStepPost;
    }

    function drawFinishedStep(step) {

        var spanString = '<span class="workflow-stage-item w3-card completed">' +
            '<span class="name">' + step.name + '</span><br>' +
            '<span class="date">' + step.progress.started.timestamp + ' - ' + workflowStep.progress.finished.timestamp + '</span><br>' +
            '<span class="description">' + step.description + '</span>' +
            '</span>';

        return spanString;
    }

    function drawCurrentStep(step) {

        var spanString = '<span class="workflow-stage-item w3-card-2 current">' +
            '<span class="name">' + step.name + '</span><br>' +
            '<span class="date">' + step.progress.started.timestamp + ' - In Progress</span><br>' +
            '<span class="description">' + step.description + '</span>' +
            '</span>';

        return spanString;
    }

    function drawFutureStep(step) {

        var spanString = '<span class="workflow-stage-item w3-card-2 future">' +
            '<span class="name">' + step.name + '</span><br>' +
            '<span class="description">' + step.description + '</span>' +
            '</span>';

        return spanString;
    }


    function drawFinishedSteps(steps, targetContainer) {
        steps = [].concat(steps);

        for (var ctr = 0; ctr < steps.length; ctr++) {
            var step = steps[ctr];
            var statusString;
            var actionString;
            var actionButton;

            statusString = '<td>Completed</td>';

            if (step.progress.isUndoable) {
                actionString = '<td class="rising-card w3-card-2 workflow-action-button undo center primary-text">Undo</td>';
                actionButton = $(actionString);

                actionButton.click(function() {
                    var postBody = {
                        'letter': mLetter._id,
                        'workflowItem': step._id
                    };

                    var onCompleteReturn = completeStage(postBody);

                    onCompleteReturn.done(function(results, status) {
                        if (status === 'success') {
                            //Must update entire workflow because server determines what happens to each step
                            mLetter.workflow = results.workflow;

                            self.renderTable();
                        }
                    });
                });

            } else {
                actionString = '<td>None</td>';
                actionButton = $(actionString);

            }
            var trString = '<tr>' +
                '<td>' + step.name + '</td>' +
                statusString +
                '</tr>';

            var tr = $(trString);
            tr.append(actionButton);

            if (targetContainer) {
                targetContainer.find('.workflow-table').append(tr);
            } else {
                $('.workflow-table').append(tr);
            }
        }
    }

    function drawCurrentSteps(steps, targetContainer) {
        steps = [].concat(steps);

        for (var ctr = 0; ctr < steps.length; ctr++) {
            var step = steps[ctr];

            var statusString;
            statusString = '<td>In Progress</td>';

            var actionString;
            actionString = '<td class="rising-card w3-card-2 workflow-action-button advance primary-text center">Complete Task</td>';

            var row = $('<tr></tr>');

            var actionButton = $(actionString);

            var onCompleteReturn;

            actionButton.click(function() {
                var postBody = {
                    'letter': mLetter._id,
                    'workflowStep': step._id
                };

                var onCompleteReturn = completeStage(postBody);

                onCompleteReturn.done(function(results, status) {
                    if (status === 'success') {

                        mLetter.workflow = results.workflow;

                        self.renderTable();
                    }
                });

            });

            row.append('<td>' + step.name + '</td>');
            row.append(statusString);
            row.append(actionButton);

            if (targetContainer) {
                targetContainer.find('.workflow-table').append(row);
            } else {
                $('.workflow-table').append(row);
            }
        }
    }

    function drawFutureSteps(steps, targetContainer) {
        steps = [].concat(steps);

        for (var ctr = 0; ctr < steps.length; ctr++) {
            var step = steps[ctr];
            var statusString;
            statusString = '<td>Not Ready</td>';
            var actionString;
            actionString = '<td></td>';

            var trString = '<tr>' +
                '<td>' + step.name + '</td>' +
                statusString +
                actionString +
                '</tr>';

            if (targetContainer) {
                targetContainer.find('.workflow-table').append(trString);
            } else {
                $('.workflow-table').append(trString);
            }
        }
    }

    self = { // publicly accessible API

        setupTable: function(targetHTMLWrapper) {
            if (targetHTMLWrapper) {
                targetHTMLWrapper.find('.workflow-table-wrapper').append(workflowTableStructure);
            } else {
                $('.workflow-table-wrapper').append(workflowTableStructure);
            }

            return targetHTMLWrapper;
        },

        clearTableDiagram: function(targetContainer) {
            if (targetContainer) {
                targetContainer.find('.workflow-table-wrapper').empty();
            } else {
                $('.workflow-table-wrapper').empty();
            }
        },

        renderTable: function(jqueryContainer) {
            var self = this;

            if (jqueryContainer) {
                jqueryContainer = $(jqueryContainer);
            }

            this.clearTableDiagram(jqueryContainer);
            this.setupTable(jqueryContainer);

            var feedLetterItem = mLetter;

            var workflow = feedLetterItem.workflow;
            var steps = workflow.steps;

            var futureSteps = [];
            var currentSteps = [];
            var finishedSteps = [];

            steps.forEach(function(step) {
                if (step.progress.finished.hasOccurred) {
                    finishedSteps.push(step);
                } else if (step.progress.started.hasOccurred) {
                    currentSteps.push(step);
                } else if (step.progress.before.hasOccurred) {
                    futureSteps.push(step);
                }
            });

            drawFinishedSteps(finishedSteps, jqueryContainer);
            drawCurrentSteps(currentSteps, jqueryContainer);
            drawFutureSteps(futureSteps, jqueryContainer);

            if (typeof Reactivity !== 'undefined' && typeof Reactivity.setupCards !== 'undefined') {
                Reactivity.setupCards();
            }
        },

        setLetter: function(letter) {
            mLetter = letter;
        }
    };

    return self;
})();
