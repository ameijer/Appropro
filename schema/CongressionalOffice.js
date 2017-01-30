/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: CongressionalOffice.js
* @Last modified time: 2017-01-27T17:05:03-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports = module.exports = function(app, mongoose) {
    var Promise = require('bluebird');
    Promise.promisifyAll(mongoose);

    var CongressionalOffice = new mongoose.Schema({
        name: {
            first: String,
            last: String,
            official_full: String
        },
        bio: {
            gender: String,
        },
        currentTerm: {
            chamber: String,
            start: Date,
            end: Date,
            state: String,
            district: Number,
            party: String
        },
        info: {
            bioguide: String,
            fec: [String],
            govtrack: Number,
            votesmart: Number,
            wikipedia: String,
            ballotpedia: String,
            wikidata: String,
            maplight: Number
        },
        staff: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account'
        }],
        pendingStaff: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account'
        }],
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        }],
        pendingAdmins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        }],
        //approp-specific settings
        appropSettings: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AppropSettings'
        },
        etherGroupID: String //used for etherpad
    });
    if (app && app.db) {
        app.db.model('CongressionalOffice', CongressionalOffice);
    } else if (mongoose) {
        return mongoose.model('CongressionalOffice', CongressionalOffice);
    }
};
