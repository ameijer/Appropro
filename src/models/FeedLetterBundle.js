/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: FeedLetterBundle.js
* @Last modified time: 2017-01-27T17:12:54-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



var mongoose = require('mongoose');

var FeedLetterBundle = new mongoose.Schema({
    name: String,
    FY: String,
    rSubcommitee: String,
    date: {
        type: Date,
        default: Date.now
    },

    rFeedLetters: [String]
});

module.exports = mongoose.model('FeedLetterBundle', FeedLetterBundle);
