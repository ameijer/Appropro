/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: Subcommittee.js
* @Last modified time: 2017-01-27T17:07:18-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports = module.exports = function(app, mongoose) {
    var Subcommittee = new mongoose.Schema({
        name: String,
        nickname: String,
        committee: String,
        description: String,
        budget: {
            original: Number,
            used: Number,
            remaining: Number
        },
        letters: [String],
        deadlines: {
            appropriations: 'Date'
        },
        color: String,
        chair: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CongressionalOffice'
        },
        rankingMember: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CongressionalOffice'
        }
    });

    if (app && app.db) {
        app.db.model('Subcommittee', Subcommittee);
    } else if (mongoose) {
        return mongoose.model('Subcommittee', Subcommittee);
    }
};
