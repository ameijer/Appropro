/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: Status.js
* @Last modified time: 2017-01-27T17:06:51-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var statusSchema = new mongoose.Schema({
            _id: {
                type: String
            },
            pivot: {
                type: String,
                default: ''
            },
            name: {
                type: String,
                default: ''
            }
        });
        statusSchema.plugin(require('./plugins/pagedFind'));
        statusSchema.index({
            pivot: 1
        });
        statusSchema.index({
            name: 1
        });
        statusSchema.set('autoIndex', (app.get('env') === 'development'));
        app.db.model('Status', statusSchema);
    };

})();
