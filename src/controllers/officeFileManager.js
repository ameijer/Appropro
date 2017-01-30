/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: officeFileManager.js
* @Last modified time: 2017-01-27T17:10:31-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



function mapOfficeToEtherpad(params) {
    var etherClient = params.etherClient;
    var officeId = params.officeId;
    var officeModel = params.officeModel;

    if (!etherClient) {
        throw 'No etherClient';
    }

    if (!officeId) {
        throw 'No officeId';
    }

    if (!officeModel) {
        throw 'No officeModel';
    }

    return new Promise(function(resolve, reject) {
            etherClient.createEtherPadGroup(function(error, data) {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(data);
                }
            });
        })
        .then(function(etherGroupId) {
            return officeModel.findByIdAndUpdate(
                officeId, {
                    'etherGroupID': etherGroupId
                }, {
                    safe: true,
                    upsert: true
                }
            );
        })
        .catch(function(error) {
            return Promise.reject(error);
        });
};

exports.setupOfficeEtherpad = function(req, res, next) {
    if (!req.app.etherClient) {
        throw 'Requires etherClient to be attached to req.app';
    }

    if (!req.user.office) {
        throw 'Requires req.officeId';
    }

    if (!req.app.db.models.CongressionalOffice) {
        throw 'Requires CongressionalOffice to be registered as schema in the db';
    }

    var config = {
        'etherClient': req.app.etherClient,
        'officeId': req.user.office,
        'officeModel': req.app.db.models.CongressionalOffice,
    };

    return mapOfficeToEtherpad(config) //then
        .then(function(etherId) {
            return res.json(etherId);
        });
};
