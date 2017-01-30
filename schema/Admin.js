/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: Admin.js
* @Last modified time: 2017-01-27T17:04:23-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var adminSchema = new mongoose.Schema({
            user: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                name: {
                    type: String,
                    default: ''
                }
            },
            name: {
                full: {
                    type: String,
                    default: ''
                },
                first: {
                    type: String,
                    default: ''
                },
                middle: {
                    type: String,
                    default: ''
                },
                last: {
                    type: String,
                    default: ''
                },
            },
            groups: [{
                type: String,
                ref: 'AdminGroup'
            }],
            permissions: [{
                name: String,
                permit: Boolean
            }],
            timeCreated: {
                type: Date,
                default: Date.now
            },
            search: [String]
        });
        adminSchema.methods.hasPermissionTo = function(something) {
            //check group permissions
            var groupHasPermission = false;
            for (var i = 0; i < this.groups.length; i++) {
                for (var j = 0; j < this.groups[i].permissions.length; j++) {
                    if (this.groups[i].permissions[j].name === something) {
                        if (this.groups[i].permissions[j].permit) {
                            groupHasPermission = true;
                        }
                    }
                }
            }

            //check admin permissions
            for (var k = 0; k < this.permissions.length; k++) {
                if (this.permissions[k].name === something) {
                    if (this.permissions[k].permit) {
                        return true;
                    }

                    return false;
                }
            }

            return groupHasPermission;
        };
        adminSchema.methods.isMemberOf = function(group) {
            for (var i = 0; i < this.groups.length; i++) {
                if (this.groups[i]._id === group) {
                    return true;
                }
            }

            return false;
        };
        adminSchema.plugin(require('./plugins/pagedFind'));
        adminSchema.index({
            'user.id': 1
        });
        adminSchema.index({
            search: 1
        });
        adminSchema.set('autoIndex', (app.get('env') === 'development'));
        if (app.db) {
            app.db.model('Admin', adminSchema);
        } else if (mongoose) {
            return mongoose.model('Admin', adminSchema);
        }
    };

})();
