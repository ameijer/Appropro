/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: StatusLog.js
* @Last modified time: 2017-01-27T17:07:01-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var statusLogSchema = new mongoose.Schema({
            id: {
                type: String,
                ref: 'Status'
            },
            name: {
                type: String,
                default: ''
            },
            userCreated: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                name: {
                    type: String,
                    default: ''
                },
                time: {
                    type: Date,
                    default: Date.now
                }
            }
        });

        if (app.db) {
            app.db.model('StatusLog', statusLogSchema);
        } else if (mongoose) {
            return mongoose.model('StatusLog', statusLogSchema);
        }
    };

})();
