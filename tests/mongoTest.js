/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: mongoTest.js
* @Last modified time: 2017-01-29T18:02:43-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



var mongoose = require('mongoose');

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

});

var userSchema = new mongoose.Schema({
    name: {
        first: String,
        last: {
            type: String,
            trim: true
        }
    },
    age: {
        type: Number,
        min: 0
    }
});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'PowerUsers' collection in the MongoDB database
var PUser = mongoose.model('PowerUsers', userSchema);

// Clear out old data
PUser.remove({}, function(err) {
    if (err) {
        console.log('error deleting old data.', err);
    } else {
        console.log("removed successfully");
    }
});

// Creating one user.
var johndoe = new PUser({
    name: {
        first: 'John',
        last: 'Doe'
    },
    age: 25
});

// Saving it to the database.
johndoe.save(function(err) {
    if (err) console.log('Error on save!')
});

// Creating more users manually
var janedoe = new PUser({
    name: {
        first: 'Jane',
        last: 'Doe'
    },
    age: 65
});
janedoe.save(function(err) {
    if (err) console.log('Error on save!')
});

// Creating more users manually
var alicesmith = new PUser({
    name: {
        first: 'Alice',
        last: 'Smith'
    },
    age: 45
});
alicesmith.save(function(err) {
    if (err) console.log('Error on save!')
});

//mongoose.connection.close();
