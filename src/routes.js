/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: routes.js
* @Last modified time: 2017-01-29T17:57:59-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



module.exports = function(params) {
    var roleUser = params.roleUser;
    var passport = require('passport');

    var router = require('express').Router();
    var ensureLoggedIn = require('./auth/connect-ensure-login').ensureLoggedIn;

    var crypto = require('crypto');

    var loginRedirectURI = "https://auth.appropro.co/login";

    router.get('/', ensureLoggedIn(loginRedirectURI), function(req, res) {
        res.render('letters', {
            user: req.user
        });
    });

    router.get('/', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').init);

    router.get('/congress', ensureLoggedIn(loginRedirectURI),
        function(req, res) {
            var found = req.app.db.models.CongressionalOffice.find().exec();

            found.then(function(results) {
                return res.json({
                    "congress": results
                });
            });

        }
    );

    router.post('/congress', ensureLoggedIn(loginRedirectURI),
        function(req, res) {
            var found = req.app.db.models.CongressionalOffice.find().select('name').sort('name.last').exec();
            found.then(
                function(results) {
                    return res.json({
                        "congress": results
                    });
                }
            );
        }
    );

    router.get('/users', ensureLoggedIn(loginRedirectURI),
        function(req, res) {
            req.app.db.models.Account.find().exec(
                function(err, results) {
                    res.json({
                        "users": results
                    });
                }
            );
        }
    );

    router.get('/who-am-I', ensureLoggedIn(loginRedirectURI),
        function(req, res, next) {
            return res.json({
                'user': req.user
            });
        }
    );

    router.get('/who-am-i', ensureLoggedIn(loginRedirectURI),
        function(req, res, next) {
            return res.json({
                'user': req.user
            });

        }
    );

    router.get('/subcommittees', ensureLoggedIn(loginRedirectURI),
        function(req, res) {
            var found = req.app.db.models.Subcommittee.find().sort({
                'name': -1
            }).populate("chair rankingMember").exec();
            found.then(function(subcommittees) {
                res.json({
                    "subcommittees": subcommittees
                });
            });
        }
    );


    router.get('/letters/:letterId', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').findById);
    router.get('/letters', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').findAll);
    router.get('/letters/ether-id/:etherId', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').findByEtherId);
    router.get('/web-editor/:letterId', ensureLoggedIn(loginRedirectURI), require('./views/letters/editor/index').init);

    router.post('/letters/signatures/considering/:letterId', ensureLoggedIn(loginRedirectURI), require('./views/letters/signatures/index').changeDisposition);
    router.post('/letters/signatures/willSign/:letterId', ensureLoggedIn(loginRedirectURI), require('./views/letters/signatures/index').changeDisposition);
    router.post('/letters/signatures/signed/:letterId', ensureLoggedIn(loginRedirectURI), require('./views/letters/signatures/index').changeDisposition);
    router.post('/letters/signatures/denied/:letterId', ensureLoggedIn(loginRedirectURI), require('./views/letters/signatures/index').changeDisposition);

    router.get('/recentLettersFeed', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').recent);
    router.post('/recentLettersFeed', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').recent);

    router.get('/myLettersFeed', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').mine);
    router.post('/myLettersFeed', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').mine);

    router.get('/officeLettersFeed', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').office);
    router.post('/officeLettersFeed', ensureLoggedIn(loginRedirectURI), require('./views/letters/index').office);

    router.get('/newLetter', ensureLoggedIn(loginRedirectURI), require('./views/letters/create/index').init);
    router.post('/newLetter', ensureLoggedIn(loginRedirectURI), require('./views/letters/create/index').newLetter);

    router.post('/landing/interestedClient', require('./views/landing/index').interestedClient);
    router.get('/landing', require('./views/landing/index').init);

    router.get('/workflow/stage/:flow', ensureLoggedIn(loginRedirectURI), require('./views/workflow/index').getStage);
    router.get('/workflow/step/id', ensureLoggedIn(loginRedirectURI), require('./views/workflow/index').getStepById);

    router.post('/workflow/step/undo', ensureLoggedIn(loginRedirectURI), require('./views/workflow/index').undoWorkflowStep);
    router.post('/workflow/step/finish', ensureLoggedIn(loginRedirectURI), require('./views/workflow/index').finishWorkflowStep);

    router.get('/Toolkit', ensureLoggedIn(loginRedirectURI), require('./views/toolkit/index').init);

    router.get('/backdoor/workflows', require('./views/workflow/backdoor').retrievePopulatedWorkflows);
    router.get('/backdoor/create', ensureLoggedIn(loginRedirectURI), require('./views/workflow/backdoor').putCreatedWorkflow);
    router.get('/backdoor/import', ensureLoggedIn(loginRedirectURI), require('./views/workflow/backdoor').putImportedWorkflow);
    router.get('/backdoor/approp', ensureLoggedIn(loginRedirectURI), require('./views/workflow/backdoor').putAppropSettings);


    return router;
};
