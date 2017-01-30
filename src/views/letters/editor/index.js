/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: index.js
* @Last modified time: 2017-01-29T16:31:36-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



//used for connecting to EXISTING letters
exports.init = function(req, res, next) {
    //get user's office
    var user = req.user;

    console.log('editor init');
    if (!user.hasValidEtherSession()) {
        console.log('editor has valid ether session');
        // next, set up session
        req.app.etherClient.giveWriteAccess(user.office, user, function(error, user) {
            if (error !== null) {
                return next(error);
            }


            //save updated user
            user.save(
                function(err) {
                    if (err) {
                        console.log('error saving user' + req.user._id + ': ' + err);
                        return next(err);
                    } else {
                        console.log('user: ' + req.user._id + ' saved successfully');
                    }
                }
            );

            res.cookie('sessionID', user.etherSession.sessionID, {
                domain: '.appropro.co',
                maxAge: (24 * 3600 * 30),
                httpOnly: false,
                path: '/'
            });
            console.log('successful get of letter editor by user: ' + req.user.username);
            res.render('letters/editor/index', {});
        });

    } else {
        res.cookie('sessionID', user.etherSession.sessionID, {
            domain: '.appropro.co',
            maxAge: (24 * 3600 * 30),
            httpOnly: false,
            path: '/'
        });
        res.render('letters/editor/index', {});
    }
};
