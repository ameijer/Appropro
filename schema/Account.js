/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: Account.js
* @Last modified time: 2017-01-27T17:03:23-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var accountSchema = new mongoose.Schema({
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
            isVerified: {
                type: String,
                default: ''
            },
            verificationToken: {
                type: String,
                default: ''
            },
            name: {
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
                full: {
                    type: String,
                    default: ''
                }
            },
            phone: {
                type: String,
                default: ''
            },
            zip: {
                type: String,
                default: ''
            },
            status: {
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
            },
            statusLog: [mongoose.modelSchemas.StatusLog],
            groups: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group'
            }],
            notes: [mongoose.modelSchemas.Note],
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
            },
            search: [String]

        });
        accountSchema.plugin(require('./plugins/pagedFind'));
        accountSchema.index({
            user: 1
        });
        accountSchema.index({
            'status.id': 1
        });
        accountSchema.index({
            search: 1
        });
        accountSchema.set('autoIndex', (app.get('env') === 'development'));

        accountSchema.methods.hasPermissionTo = function(something) {
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

            return groupHasPermission;
        };

        accountSchema.methods.isMemberOf = function(group) {
            for (var i = 0; i < this.groups.length; i++) {
                if (this.groups[i]._id === group) {
                    return true;
                }
            }

            return false;
        };

        //app.db.model('Account', accountSchema);
        if (app.db) {
            app.db.model('Account', accountSchema);
        } else if (mongoose) {
            return mongoose.model('Account', accountSchema);
        }
    };

})();
