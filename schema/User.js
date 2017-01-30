/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: User.js
* @Last modified time: 2017-01-27T17:08:05-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function() {
    'use strict';

    exports = module.exports = function(app, mongoose) {
        var userSchema = new mongoose.Schema({
            username: {
                type: String,
                unique: true
            },
            password: String,
            email: {
                type: String,
                unique: true
            },
            roles: {
                admin: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Admin'
                },
                account: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Account'
                }
            },
            isActive: String,
            timeCreated: {
                type: Date,
                default: Date.now
            },
            resetPasswordToken: String,
            resetPasswordExpires: Date,
            twitter: {},
            github: {},
            facebook: {},
            google: {},
            tumblr: {},
            search: [String],
            //app-specific stuff
            office: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CongressionalOffice',
                default: '576481c1e8f324847c2b7788'
            },
            watchingLetters: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FeedLetterItems'
            }],
            jobTitle: String,
            etherAuthorID: String,
            invite: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Invite'
            },
            rImage: String,
            events: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event'
            }],
            etherSession: {
                sessionID: String,
                authorID: String,
                groupID: String,
                validUntil: Number
            } //see http://etherpad.org/doc/v1.5.1/#index_session
        });
        userSchema.methods.canPlayRoleOf = function(role) {
            if (role === "admin" && this.roles.admin) {
                return true;
            }

            if (role === "account" && this.roles.account) {
                return true;
            }

            return false;
        };

        userSchema.methods.hasValidEtherSession = function() {
            if (!this.etherSession || !this.etherSession.validUntil || !this.etherSession.sessionID || !this.etherSession.groupID) return false;

            if (Date.now() > this.etherSession.validUntil) return false;

            return true;

        };

        userSchema.methods.defaultReturnUrl = function() {
            var returnUrl = '/';
            if (this.canPlayRoleOf('account')) {
                returnUrl = '/account/';
            }

            if (this.canPlayRoleOf('admin')) {
                returnUrl = '/admin/';
            }

            return returnUrl;
        };
        userSchema.statics.encryptPassword = function(password, done) {
            var bcrypt = require('bcryptjs');
            bcrypt.genSalt(10, function(err, salt) {
                if (err) {
                    return done(err);
                }

                bcrypt.hash(password, salt, function(err, hash) {
                    done(err, hash);
                });
            });
        };
        userSchema.statics.validatePassword = function(password, hash, done) {
            var bcrypt = require('bcryptjs');
            bcrypt.compare(password, hash, function(err, res) {
                done(err, res);
            });
        };
        userSchema.plugin(require('./plugins/pagedFind'));
        userSchema.index({
            username: 1
        }, {
            unique: true
        });
        userSchema.index({
            email: 1
        }, {
            unique: true
        });
        userSchema.index({
            timeCreated: 1
        });
        userSchema.index({
            'twitter.id': 1
        });
        userSchema.index({
            'github.id': 1
        });
        userSchema.index({
            'facebook.id': 1
        });
        userSchema.index({
            'google.id': 1
        });
        userSchema.index({
            search: 1
        });
        userSchema.set('autoIndex', (app.get('env') === 'development'));
        if (app.db) {
            app.db.model('User', userSchema);
        } else if (mongoose) {
            return mongoose.model('User', userSchema);
        }
    };

})();
