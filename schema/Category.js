/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: Category.js
* @Last modified time: 2017-01-27T17:04:38-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var categorySchema = new mongoose.Schema({
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
        categorySchema.plugin(require('./plugins/pagedFind'));
        categorySchema.index({
            pivot: 1
        });
        categorySchema.index({
            name: 1
        });
        categorySchema.set('autoIndex', (app.get('env') === 'development'));
        app.db.model('Category', categorySchema);
    };

})();
