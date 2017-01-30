/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: LoginAttempt.js
* @Last modified time: 2017-01-27T17:05:50-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var attemptSchema = new mongoose.Schema({
            ip: {
                type: String,
                default: ''
            },
            user: {
                type: String,
                default: ''
            },
            time: {
                type: Date,
                default: Date.now,
                expires: app.config.loginAttempts.logExpiration
            }
        });
        attemptSchema.index({
            ip: 1
        });
        attemptSchema.index({
            user: 1
        });
        attemptSchema.set('autoIndex', (app.get('env') === 'development'));
        app.db.model('LoginAttempt', attemptSchema);
    };

})();
