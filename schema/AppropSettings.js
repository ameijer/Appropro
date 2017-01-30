/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: AppropSettings.js
* @Last modified time: 2017-01-27T17:04:07-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



exports = module.exports = function(app, mongoose) {

    /*
     * @param workflows -
     *		Contains the user's workflow templates array.
     */

    var AppropSettings = new mongoose.Schema({
        office: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CongressionalOffice'
        },
        letters: [String],
        workflows: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workflow'
        }],
        enabledUsers: [String]
    });

    /*
     * Convenience function for finding the workflow by name. This allows for flexible workflow naming
     */
    AppropSettings.methods.lookupByName = function(lookupName) {
        var lookup = {};

        for (var i = 0, len = this.workflows.length; i < len; i++) {
            lookup[this.workflows[i].name.toLowerCase()] = this.workflows[i];
        }

        return lookup[lookupName.toLowerCase()];
    };


    if (app && app.db) {
        app.db.model('AppropSettings', AppropSettings);
    } else if (mongoose) {
        return mongoose.model('AppropSettings', AppropSettings);
    }
};
