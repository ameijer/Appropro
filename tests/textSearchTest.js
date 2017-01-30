/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: textSearchTest.js
* @Last modified time: 2017-01-29T18:04:02-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



var mongoose = require('../node_modules/mongoose');
require('../src/models/FeedLetterItem.js')(null, mongoose);
var url = 'mongodb://127.0.0.1:27017/appropro_obj';
var o = {
    server: {
        ssl: true,
        sslValidate: false,
        //      sslKey: key,
        //      sslCert:key
    },
    user: '<redacted>',
    pass: '<redacted>'
};


// Use connect method to connect to the Server
mongoose.connect(url, o, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        //HURRAY!! We are connected. :)
        console.log('Connection established to', url);
    }

    var queryTerms = null;
    var subcommitteeIds = null;
    var officeIds = ['576481c1e8f324847c2b7788'];

    mongoose.models.FeedLetterItem.schema.methods.search( /*String */ queryTerms, /*String []*/ subcommitteeIds, /*String []*/ officeIds, /*Mongoose */ mongoose, function(error, results) {
        if (error) {
            throw error;
        }

        console.log('found docs: ');

        results.forEach(function(item) {
            console.log('title: ' + item.title + ' id: ' + item._id);
        });
        process.exit();

    });
});
