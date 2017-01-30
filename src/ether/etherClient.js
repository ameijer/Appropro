/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: etherClient.js
* @Last modified time: 2017-01-27T17:12:23-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



//etherclient.js
//2016 Anno Domini
//written by a. Meijer

var api = require('etherpad-lite-client');
var crypto = require('crypto');
var exports = module.exports = {};

var etherpad = api.connect({
    apikey: '<redacted>',
    host: 'localhost',
    port: 8080,
});

//1 group per office
exports.createEtherPadGroup = function(callback) {
    etherpad.createGroup(function(error, data) {
        if (error !== null) {
            console.log("Etherpad group creation error: " + error);
            callback(error, null);
        } else {
            console.log("group: " + data.groupID + " created successfully");
        }

        callback(null, data.groupID);
    });
};

exports.createAuthor = function( /*Account*/ user, callback) {

    if (!user._id || !user.username) {
        throw 'user id required';
    }

    console.log('creating etherpad author for user: ' + user.username);
    etherpad.createAuthor({
        name: user.username
    }, function(error, data) {

        if (error !== null) {
            console.log("Etherpad author creation error: " + JSON.stringify(error));
            callback(error, null);
        } else {
            console.log("author: " + data.authorID + " created successfully");
        }

        callback(null, {
            etherAuthorID: data.authorID
        });
    });
};

exports.getContributorsOfPad = function(padID, callback) {
    if (padID === null) {
        return callback(null, false);
    }

    console.log("padID in etherclient: " + padID);

    etherpad.listAuthorsOfPad({
        'padID': padID
    }, function(error, data) {
        if (error === null) {

            var authors = data.authorIDs;
            callback(null, authors);
        } else {
            callback(error, null);
        }
    });
};

exports.endEtherpadSession = function( /*String */ sessionid, callback) {

    if (sessionid === null) {
        return callback(null, false);
    }

    etherpad.deleteSession({
        sessionID: sessionid
    }, function(error, data) {
        if (error === null) {
            console.log("session: " + sessionid + " has successfully ended");
            toLogout.etherSession = null;
            callback(null, true);
        } else {
            console.error("FAILED TO DISABLE SESSION: " + sessionid);
            callback(error, false);
        }
    });
};

exports.setPadContents = function(padId, textToSet, callback) {
    etherpad.setText({
        'padID': padId,
        'text': textToSet
    }, function(error, data) {
        if (error === null) {
            console.log("pad contents successfully updated");
            if (callback) {
                callback(null, true);
            }
        } else {
            console.error("FAILED to set pad contents");
            if (callback) {
                callback(error, false);
            }
        }
    });
};

exports.setPadHTML = function(padId, textToSet, callback) {
    etherpad.setHTML({
        'padID': padId,
        'html': textToSet.toString()
    }, function(error, data) {
        if (error === null) {
            console.log("pad contents successfully updated");
            if (callback) {
                callback(null, true);
            }
        } else {
            console.error("FAILED to set pad html: " + JSON.stringify(error));
            if (callback) {
                callback(error, false);
            }
        }
    });
};


//fills in ether* values inside of passed object
exports.createPadForOffice = function( /*CongressionalOffice*/ office, /*LetterItem*/ letter, callback) {

    if (!office._id) {
        console.log("ERROR - office ID is REQUIRED for creating letters ");
        return null;
    }

    var id = crypto.randomBytes(20).toString('hex');

    var name = id.substring(0, 17) + '_' + letter.FY + '_' + office._id;

    var args = {
        groupID: office.etherGroupID,
        padName: name,
        text: " "
    };

    //returns {code: 0, message:"ok", data: {padID: "g.s8oes9dhwrvt0zif$test"}}
    etherpad.createGroupPad(args, function(error, data) {
        if (error !== null) {
            console.log("Etherpad pad creation error: " + JSON.stringify(error));
            callback(error, null);
            return;
        } else {
            console.log("pad: " + data.padID + " created successfully");
        }


        //step II: get read only info
        //return {code: 0, message:"ok", data: {readOnlyID: "r.s8oes9dhwrvt0zif"}}
        etherpad.getReadOnlyID({
            padID: data.padID
        }, function(error, data2) {
            if (error !== null) {
                console.log("Etherpad pad read only link creation error: " + JSON.stringify(error));
                callback(error, null);
                return;
            } else {
                console.log("read only link for pad: " + data.padID + " created successfully: " + data2.readOnlyID);
            }

            //add pad ptr to letter
            letter.etherPadID = data.padID;
            letter.etherReadOnlyID = data2.readOnlyID;
            callback(null, letter);
        });
    });
};


//see http://etherpad.org/doc/v1.5.1/#index_session
exports.giveWriteAccess = function( /*CongressionalOffice*/ office, /*Account*/ user, callback) {

    var session = {};
    var now = Date.now();

    //default to 1 day of access
    now += 1000 * 60 * 60 * 24 * 500; //timestamp advanced to 24 hours in the future

    session.validUntil = now;
    session.authorID = user.etherAuthorID;
    session.groupID = office.etherGroupID;

    etherpad.createSession(session, function(error, data) {

        if (error !== null) {
            console.log("Etherpad session creation error: " + error);
            callback(error, null);
        } else {
            console.log("session: " + data.sessionID + " created successfully for user: " + user.username);
        }

        session.sessionID = data.sessionID;

        user.etherSession = session;

        callback(null, user);
    });
};
