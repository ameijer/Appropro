/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: index.js
* @Last modified time: 2017-01-29T16:34:35-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports.init = function(req, res) {
    res.render('letters/index');
};

exports.findById = function(req, res) {
    var targetId = req.params.letterId;

    var findPromise = req.app.db.models.LetterItem.findById(targetId) //then
        .exec();

    findPromise.then(function(letter) {
        return res.send(letter);
    });
};

exports.findByEtherId = function(req, res) {
    var targetId = req.params.etherId;
    var promise = req.app.db.models.LetterItem.findOneByEtherId(targetId, false) //then
        .populate('offices.lead offices.colead offices.considering offices.willSign offices.signed offices.denied')
        .populate({
            path: 'workflow',
            model: 'Workflow',
            populate: {
                path: 'steps',
                model: 'WorkflowStep'
            }
        })
        .exec();

    promise.then(function(results) {
        return res.send(results);
    });
};

exports.recent = function(req, res, next) {
    var searchParams = '';
    searchParams = req.body || {};

    if (typeof req.body.searchParams !== undefined) {
        //Could malicious code be injected into the search params?
        searchParams = req.body || {};
    } else {
        unfilteredSearch();
    }

    var queryTerms = searchParams.queryTerms;
    var subcommitteeIds = searchParams.subcommitteeIds;
    var officeIds = searchParams.officeIds;

    var query = req.app.db.models.LetterItem.find({});

    if (typeof queryTerms !== 'undefined' && null !== queryTerms) {
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

    if (typeof officeIds !== 'undefined' && null !== officeIds && [] !== officeIds) {
        query = query.where({
            'offices.lead': {
                $in: officeIds
            }
        });
    }

    if (typeof subcommitteeIds !== 'undefined' && null !== subcommitteeIds && [] !== subcommitteeIds) {
        query = query.where({
            subcommittee: {
                $in: subcommitteeIds
            }
        });
    }

    doLetterQuery(query) //then
        .then(function(letters) {
            return res.json({
                'letterItems': letters
            });
        });
};

exports.findAll = function(req, res, next) {
    return doLetterQuery(query) //then
        .then(function(letters) {
            return res.json(letters);
        });
};

exports.office = function(req, res) {
    var searchParams = '';

    //TODO: Add search params to this retrieval
    var user = req.user;

    var officeId = req.user.office._id || req.user.office;

    var query = {
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
    };

    return doLetterQuery(query) //then
        .then(function(letters) {
            return res.json({
                "letterItems": letters
            });
        });

};

function doLetterQuery(query) {
    var found = req.app.db.models.LetterItem.find(query) //then
        .populate('offices.lead offices.colead offices.considering offices.willSign offices.signed offices.denied')
        .populate({
            path: 'workflow',
            model: 'Workflow',
            populate: {
                path: 'steps',
                model: 'WorkflowStep'
            }
        })
        .exec();

    return found;
}

exports.mine = function(req, res, next) {
    //TODO: Add search params to this retrieval
    var user = req.user;

    var searchParams = req.body.searchParams || {};

    var queryTerms = searchParams.queryTerms;
    var subcommitteeIds = searchParams.subcommitteeIds;
    var officeIds = searchParams.officeIds;

    var query = req.app.db.models.LetterItem.find();

    if (queryTerms) {
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

    if (officeIds) {
        query = query.where({
            'offices.lead': {
                $in: officeIds
            }
        });
    }

    if (subcommitteeIds) {
        query = query.where({
            subcommittee: {
                $in: subcommitteeIds
            }
        });
    }

    //TODO:
    //Update this query to include the new contributing user fields.

    query = query.and({
        $or: [{
            'contributors': user
        }]
    });

    doLetterQuery(query) //then
        .then(function(letters) {
            return res.json({
                'letterItems': letters
            });
        });
};
