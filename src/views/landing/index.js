/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: index.js
* @Last modified time: 2017-01-29T16:23:56-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports.init = function(req, res) {
    res.render('landing/index');
};

exports.interestedClient = function(req, res) {
    //req.
    var clientInfo = req.body;
    console.log(req.body);
    var toSave = {};

    toSave.contact = {
        phone: {
            number: clientInfo.phone,
            okayToContact: true
        },
        email: {
            address: clientInfo.email,
            okayToContact: true
        },
        name: clientInfo.name
    };
    toSave.office = clientInfo.office;
    toSave.currentStatus = 'INTERESTED';
    toSave.messages = [clientInfo.message];

    req.app.db.models.MessageForAdmins.create(toSave, function(err, savedMessage) {
        if (err) {
            res.status(500).send('error saving message');
            return;
        }

        //letter is successfully created + saved in DB, do whatever else you need hasValidEtherSession
        res.status(200).send('thank you for your interest!');

    });
};
