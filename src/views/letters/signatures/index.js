/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: index.js
* @Last modified time: 2017-01-29T16:32:26-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



(function() {
    'use strict';

    /*
     * SignatureOperationRequestInfo is essentially the same pattern as express uses with the req object.
     * It wraps the express req object, and adds a few fields for storing retrieved mongoose objects.
     * In the future, these fields might get stored dirctly into the req object, but this approach
     * provides some clarity of field names and classifies stepOperationRequests as containing letterId, user.office, and
     *
     */

    function SignatureOperationRequestInfo(req, letterId, operation, listName, letter) {
        sanitizeSignatureOperationRequest(letterId, operation, listName);

        this.letterId = letterId;
        this.operation = operation.toUpperCase();
        this.listName = listName;
        this.req = req;

        return this;
    }

    var sanitizeSignatureOperationRequest = function(letterId, operation, listName) {
        var errorMessage = '';

        operation = operation.toUpperCase();
        if (!(operation === OperationTypes.ADD || operation === OperationTypes.REMOVE)) {
            errorMessage = errorMessage + ' Invalid operation in request';
        }

        if (!(listName === ListNames.considering || listName === ListNames.willSign || listName === ListNames.signed || listName === ListNames.denied)) {
            errorMessage = errorMessage + ' Invalid listname in request';
        }

        if (errorMessage) {
            throw errorMessage;
        } else {
            return true;
        }
    };

    var OperationTypes = {
        ADD: 'ADD',
        REMOVE: 'REMOVE'
    };
    var ListNames = {
        considering: 'considering',
        willSign: 'willSign',
        signed: 'signed',
        denied: 'denied'
    };

    exports.changeDisposition = function(req, res, next) {
        var letterId = req.params.letterId;
        var operation = req.body.operation;
        var listName = req.body.listName;
        var officeId = req.body.office._id || req.body.office;

        var sor = new SignatureOperationRequestInfo(req, letterId, operation, listName, {});

        var letterPromise = req.app.db.models.LetterItem.find({
                '_id': letterId
            }).exec() //then
            .then(function(letter) {
                //add sor.letter
                sor.letter = letter;

                var operationPromise;
                if (sor.operation === OperationTypes.ADD) {
                    operationPromise = sor.letter.addOfficeToList(officeId, sor.listName);
                } else if (sor.operation === OperationTypes.REMOVE) {
                    operationPromise = sor.letter.removeOfficeFromList(officeId, sor.listName);
                } else {
                    throw 'Invalid OperationType passed through SignatureOperation sanitization function unchecked.';
                }

                return operationPromise;
            }).then(function(updatedLetter) {
                //operation was successful, so send back the updatedLetter
                return res.json(updatedLetter);
            })
            .catch(function(err) {
                return res.status(400).send(err);
            });
    };

}());
