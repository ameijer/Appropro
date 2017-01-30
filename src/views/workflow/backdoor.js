/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: backdoor.js
* @Last modified time: 2017-01-29T17:48:44-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports.retrievePopulatedWorkflows = function(req, res, next) {
    req.app.db.models.AppropSettings.find({
            '_id': '5793d58e0694c8fd38846357'
        }).populate('workFlowImport workFlowCreate').exec() //then
        .then(function(settings) {
            return res.json(settings);
        })
        .catch(function(err) {
            return res.status(500).send(err);
        });
};

exports.putCreatedWorkflow = function(req, res, next) {

    var createdWorkflow = new req.app.db.models.Workflow();
    createdWorkflow.purpose = 'TEMPLATE';
    createdWorkflow.name = 'Created';
    createdWorkflow.description = 'Letter created in this office';

    var steps = [];
    var names = ['Created', 'Requested', 'Considering', 'Drafting Memo', 'LA Approval', 'LD Approval', 'Senator Approval', 'Push to DPCC Feed', 'Email DPCC', 'Review Potential Signatories', 'Collect Physical Signatures', 'Submit To Subcommittee'];
    var descriptions = ['Created new letter.',
        'The area focus group is editing the letter.',
        'The memo for signature collection is being drafted.',
        'The letter is evaluated by the LA.',
        'The letter is evaluated by the LD.',
        'The senator gives final approval on the letter.',
        'The letter is pushed to the DPCC Appropro feed',
        'The letter is emailed to the DPCC',
        'Assess interest from potential cosignees.',
        'The official letter is printed and circulated for signatures.',
        'The letter is officially submitted to the subcommittee.'
    ];

    var actions = [
        ['PUBLISH_CREATED_TO_OFFICE'],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ];


    var stages = [0, 1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10];

    for (var ctr = 0; ctr < 12; ctr++) {
        var step = new req.app.db.models.WorkflowStep();
        step.name = names[ctr];
        step.description = descriptions[ctr];
        step.stage = stages[ctr];
        step.purpose = 'TEMPLATE';
        step.save();
        steps.push(step._id);

        createdWorkflow.steps.push(step._id);
    }

    Promise.all([createdWorkflow.save(), req.app.db.models.CongressionalOffice.find({
            _id: req.user.office
        }).populate('appropSettings').exec()])
        .then(function(results) {
            var savedWorkflow = results[0];
            var office = results[1][0];

            office.appropSettings.workflows.push(savedWorkflow);
            return office.appropSettings.save();
        })
        .then(function(off) {
            return res.json(off);
        })
        .catch(function(err) {
            return res.status(500).send(err);
        });
};


exports.putImportedWorkflow = function(req, res, next) {

    var createdWorkflow = new req.app.db.models.Workflow();
    createdWorkflow.purpose = 'TEMPLATE';
    createdWorkflow.name = 'Imported';
    createdWorkflow.description = 'Letter originating from a different office.';

    var steps = [];
    var names = ['Considering', 'Import', 'LA Approval', 'LD Approval', 'Senator Approval', 'Signed Official Letter'];
    var descriptions = ['Letter made available to this office.',
        'Letter is under consideration.',
        'The letter is evaluated by the LA.',
        'The letter is evaluated by the LD.',
        'The senator gives final approval on the letter.',
        'The official letter is signed.',
    ];

    var actions = [
        ['PUBLISH_CREATED_TO_OFFICE'],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ];


    var stages = [0, 1, 2, 3, 4, 5];

    for (var ctr = 0; ctr < 6; ctr++) {
        var step = new req.app.db.models.WorkflowStep();
        step.name = names[ctr];
        step.description = descriptions[ctr];
        step.stage = stages[ctr];
        step.purpose = 'TEMPLATE';
        step.save();
        steps.push(step._id);

        createdWorkflow.steps.push(step._id);
    }

    Promise.all([createdWorkflow.save(), req.app.db.models.CongressionalOffice.find({
            _id: req.user.office
        }).populate('appropSettings').exec()]) //then
        .then(function(results) {
            var savedWorkflow = results[0];
            var office = results[1][0];
            office.appropSettings.workflows.push(savedWorkflow);
            return office.appropSettings.save();
        })
        .then(function(off) {
            return res.json(off);
        })
        .catch(function(err) {
            res.status(500).send(err);
        });
};

exports.putAppropSettings = function(req, res, next) {
    var settings = new req.app.db.models.AppropSettings();
    settings.office = '576481c1e8f324847c2b7788';

    settings.save().then(function(setting) {
        res.json(setting);
    });
};
