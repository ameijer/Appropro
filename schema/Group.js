/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: Group.js
* @Last modified time: 2017-01-27T17:05:37-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var groupSchema = new mongoose.Schema({
            _id: {
                type: String
            },
            office: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CongressionalOffice'
            },
            name: {
                type: String,
                default: ''
            },
            permissions: [{
                name: String,
                permit: Boolean
            }]
        });
        groupSchema.plugin(require('./plugins/pagedFind'));
        groupSchema.index({
            name: 1
        }, {
            unique: true
        });
        groupSchema.set('autoIndex', (app.get('env') === 'development'));
        if (app.db) {
            app.db.model('Group', groupSchema);
        } else if (mongoose) {
            return mongoose.model('Group', groupSchema);
        }
    };

})();
