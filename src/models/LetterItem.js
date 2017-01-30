/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: LetterItem.js
* @Last modified time: 2017-01-27T17:13:24-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports = module.exports = function(app, mongoose) {

    var Schema = mongoose.Schema;

    //NOTE: This has really turned into a "LetterItem", there will be one of these
    // for each letter.
    var LetterItem = new mongoose.Schema({
        fundingLevel: String,
        title: String,
        FY: String,
        fundingAmount: Number,
        offices: {
            lead: {
                type: Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            },
            colead: {
                type: Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            },
            considering: [{
                type: Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            }],
            willSign: [{
                type: Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            }],
            signed: [{
                type: Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            }],
            denied: [{
                type: Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            }],
        },
        subcommittee: {
            type: Schema.Types.ObjectId,
            ref: 'Subcommittee'
        },
        etherPadID: String, //used to grant write access
        etherReadOnlyID: String, //used to grant read only access. access me using https://appropro.co/editor/ro/<etherReadOnlyID>
        dateIntroduced: Date,
        contributors: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        workflow: {
            type: Schema.Types.ObjectId,
            ref: 'Workflow'
        }
    });

    LetterItem.index({
        title: 'text'
    }, {
        unique: true
    });

    //TODO use an approach similar to CongressionalOffice.js to bind mongo on creation
    //LetterItem.methods.search = function(/*String []*/ queryTerms, /*String []*/ subcommitteeIds, /*String []*/ officeIds, /*Mongoose */ mongoose, callback/*(error, letters)*/) {

    LetterItem.statics.search = function(searchRequest, execute, user) {

        searchRequest = searchRequest || {};

        //first search by terms
        var queryTerms = searchRequest.queryTerms || '';
        var subcommitteeIds = searchRequest.subcommitteeIds || [];
        var officeIds = searchRequest.officeIds || [];
        var callback = searchRequest.callback || function() {};
        var searchType = searchRequest.searchType || '';


        //var query =	app.db.models.LetterItem.find({});
        var query = this.find({});

        if (queryTerms !== '') {
            query = query.where({
                $text: {
                    $search: queryTerms
                }
            }, {
                score: {
                    $meta: "textScore"
                }
            });
        }

        if (officeIds !== []) {
            query = query.where({
                'offices.lead': {
                    $in: officeIds
                }
            });
        }

        var searchParams = '';

        if ('my-office' === searchType) {

            var officeId = '';
            if (typeof user.office === 'string') {
                officeId = user.office;
            } else {
                officeId = user.office._id;
            }

            query = query.where({
                $or: [{
                    'offices.lead': officeId
                }, {
                    'offices.colead': officeId
                }, {
                    'offices.willsign': officeId
                }, {
                    'offices.considering': officeId
                }, {
                    'offices.signed': officeId
                }, {
                    'offices.denied': officeId
                }]
            });
        }

        if (subcommitteeIds !== []) {
            query = query.where({
                subcommittee: {
                    $in: subcommitteeIds
                }
            });
        }

        var found = query.sort({
            dateIntroduced: -1
        });

        if (true === execute) {
            found = found
                .populate('offices.lead offices.colead offices.considering offices.willSign offices.signed offices.denied')
                .exec();
        }

        return found;
    };

    LetterItem.statics.findOneByEtherId = function(targetEtherId, execute) {
        //var query = app.db.models.LetterItem.findOne({'etherPadID': targetEtherId});
        var query = this.findOne({
            'etherPadID': targetEtherId
        });

        if (true === execute) {
            var queryPromise = query.exec();
            return queryPromise;
        } else {
            return query;
        }
    };

    /* createLetterItem(newLetter, user)
     *
     * @input info -
     * 		{'newLetter' required info to create a new letter
     *		 'user' -	person creating the new letter
     *		}
     * @promises the createdLetterItem
     */

    LetterItem.statics.validateAndCreate = function(newLetter) {

        if (!(newLetter instanceof app.db.models.LetterItem)) {
            return Promise.reject('Must pass a LetterItem to validateAndCreate');
        }

        var validate = validateCreationObject(newLetter);

        var createPromise;

        if (validate.isValid) {
            createPromise = app.db.models.LetterItem.count({
                    title: newLetter.title,
                    'offices.lead': newLetter.offices.lead
                }).exec()
                .then(function(numFound) {
                    if (numFound > 0) {
                        return Promise.reject('This LetterItem already exists.');
                    }
                })
                .then(newLetter.save)
                .catch(function(err) {
                    console.log(err);
                });
        } else {
            createPromise = new Promise.reject(validate.messages);
        }

        return createPromise;
    };

    LetterItem.methods.addOfficeToList = function(office, list) {
        var officeId = (typeof office === 'string') ? office : office._id;
        var currentLists = this.findAllStatusesByOffice(office);

        if (currentLists.contains(list)) {
            throw 'Attempted to add signature to a list it was already attached to.';
        }

        /*
         * Remove signature from existing lists
         */
        for (var idx = 0; idx < currentLists.length; idx++) {
            var targetList = currentLists[idx];
            var toRemove = this.offices[targetList].indexOf(officeId);

            this.offices[targetList].splice(toRemove, 1);
        }

        /*
         * Add signature to desired list
         */
        this.offices[list].push(officeId);

        var savePromise = this.save();
        return savePromise;
    };

    LetterItem.methods.removeOfficeFromList = function(office, list) {
        var officeId = (typeof office === 'string') ? office : office._id;
        var currentLists = this.findAllStatusesByOffice(office);

        if (!currentLists.contains(list)) {
            throw 'Attempted to remove signature to a from a list that it was not attached to.';
        }

        /*
         * Remove signature from desired list
         */
        var toRemove = this.offices[list].indexOf(officeId);
        this.offices[type].splice(toRemove, 1);

        /*
         * Add signature to desired list
         */
        this.offices[list].push(officeId);

        var savePromise = this.save();
        return savePromise;
    };

    LetterItem.methods.findAllStatusesByOffice = function(office) {
        var officeId = (typeof office === 'string') ? office : office._id;

        if (!officeId) {
            throw 'Unknown officeId';
        }

        var hasNoSignatures = true;
        var isPopulated = false;

        /*
         * Check if the offices have any signatures, and if the signing offices are populated or are mongo pointers.
         */
        for (var listName in this.offices) {
            if (this.offices[listName].length > 0) {
                hasNoSignatures = false;

                if (this.offices[listName][0]._id) {
                    isPopulated = true;
                }
            }
        }

        /*
         * For each signing list (considering, willSign, signed, denied), check if that list includes the office.
         *  Need a different approach if the offices are populated vs if they aren't populated.
         */

        var statuses = [];
        if (!hasNoSignatures) {
            for (var list in this.offices) {
                if (this.offices.hasOwnProperty(list)) {
                    var officeList = this.offices[list];

                    if (isPopulated) {
                        var matches = officeList.filter(function(office) {
                            return office._id === officeId;
                        });

                        if (matches.length > 0) {
                            statuses.push(list);
                        }

                    } else {
                        if (officeList.contains(officeId)) {
                            statuses.push(list);
                        }
                    }
                }
            }
        }

        return statuses;
    };

    function putMessage(name, description, messages) {
        messages[name] = description;
    }

    function clearMessages(messages) {
        messageBus = {};
    }

    function validateTitle(title, messages) {
        var isValid = true;

        if (!title) {
            isValid = false;
            putMessage('title', 'Must choose a title.', messages);
            return isValid;
        }

        if (isValid.length < 3) {
            putMessage('title', "Title must be at least 3 letters long.", messages);
            isValid = false;
        }

        return isValid;
    }

    function validateColead(colead, messages) {
        var isValid = true;

        console.log(colead === 'no-selection');
        if (typeof colead === 'undefined' || colead === null || colead === "" || colead === 'no-selection') {
            putMessage('colead', 'Choose a colead', messages);
            isValid = false;
        }

        return isValid;
    }

    function validateSubcommittee(sub, messages) {
        var isValid = true;

        if (typeof sub === 'undefined' || sub === null || sub === '' || sub === 'no-selection') {
            putMessage('subcommittee-message', 'Choose a subcommittee.', messages);
            isValid = false;
        }

        return isValid;
    }

    function validateFundingYear(fundingYear, messages) {
        var isValid = true;

        if (typeof fundingYear === 'undefined' || fundingYear === null) {
            putMessage('funding-year', 'Choose a funding year.', messages);
            isValid = false;
            return isValid;
        }

        if (fundingYear < 0) {
            isValid = false;
        }

        return isValid;
    }

    function validateFundingAmount(funding, messages) {
        var isValid = true;

        if (typeof funding === 'undefined' || funding === null) {
            putMessage('funding-amount', 'Choose a funding amount.', messages);
            isValid = false;
        }

        return isValid;
    }

    function validateDateIntroduced(dateIntroduced, messages) {
        var isValid = true;

        if (typeof dateIntroduced === 'undefined' || dateIntroduced === null) {
            putMessage('date-introduced', 'When was this letter initially created?', messages);
            isValid = false;
            return isValid;
        }

        return isValid;
    }

    function validateFileImport(messages) {
        return true;
    }

    //TODO: These validation tools are not tied in correctly

    function validateCreationObject(newLetter) {
        var isValid = true;
        var messageBus = {};

        //Want to check each option and give user feedback
        //It only takes one invalid field to invalidate
        //validateSomething() must come before && isValid in order to guarantee execution.

        isValid = validateTitle(newLetter.title, messageBus) && isValid;
        isValid = validateColead(newLetter.offices.colead, messageBus) && isValid;
        isValid = validateSubcommittee(newLetter.subcommittee, messageBus) && isValid;
        isValid = validateFundingYear(newLetter.FY, messageBus) && isValid;
        isValid = validateFundingAmount(newLetter.fundingAmount, messageBus) && isValid;
        isValid = validateDateIntroduced(newLetter.dateIntroduced, messageBus) && isValid;
        isValid = validateFileImport(newLetter, messageBus) && isValid;


        //TODO: make messageBus externally available.

        return {
            'isValid': isValid,
            'messages': messageBus
        };
    }

    if (app && app.db) {
        LetterItem.plugin(app.deepPopulate);
        app.db.model('LetterItem', LetterItem);
    } else if (mongoose) {
        return mongoose.model('LetterItem', LetterItem);
    }
};
