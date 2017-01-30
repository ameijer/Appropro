/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: MessageForAdmins.js
* @Last modified time: 2017-01-27T17:13:49-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



exports = module.exports = function(app, mongoose) {
    Schema = mongoose.Schema;

    var Promise = require('bluebird');
    Promise.promisifyAll(mongoose);

    var MessageForAdmins = new mongoose.Schema({
        contact: {
            phone: {
                number: String,
                okayToContact: Boolean
            },
            email: {
                address: String,
                okayToContact: Boolean
            },
            name: String,
        },

        office: String,
        currentStatus: String,
        messages: [{
            date: Date,
            message: String,
            direction: String
        }]
    });

    MessageForAdmins.index({
        title: 'text'
    });


    //TODO use an approach similar to CongressionalOffice.js to bind mongo on creation
    MessageForAdmins.methods.search = function( /*String []*/ queryTerms, /*Mongoose */ mongoose, callback /*(error, letters)*/ ) {
        //first search by terms

        var query = mongoose.models.MessageForAdmins.find({});

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

        query.sort({
            dateIntroduced: -1
        }).exec(callback);
    };


    //app.db.model('Note', noteSchema);
    if (app && app.db) {
        app.db.model('MessageForAdmins', MessageForAdmins);
    } else if (mongoose) {
        return mongoose.model('MessageForAdmins', MessageForAdmins);
    }
};
