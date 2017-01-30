/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: Event.js
* @Last modified time: 2017-01-27T17:05:42-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Event = new mongoose.Schema({
    status: String,
    category: String,
    action: {},
    originator: {
        type: Schema.Types.ObjectId,
        ref: 'Account'
    }
});

module.exports = mongoose.model('Event', Event);
