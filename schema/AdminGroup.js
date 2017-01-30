/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: AdminGroup.js
* @Last modified time: 2017-01-27T17:04:30-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var adminGroupSchema = new mongoose.Schema({
            _id: {
                type: String
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
        adminGroupSchema.plugin(require('./plugins/pagedFind'));
        adminGroupSchema.index({
            name: 1
        }, {
            unique: true
        });
        adminGroupSchema.set('autoIndex', (app.get('env') === 'development'));
        if (app.db) {
            app.db.model('AdminGroup', adminGroupSchema);
        } else if (mongoose) {
            return mongoose.model('AdminGroup', adminGroupSchema);
        }
    };

})();
