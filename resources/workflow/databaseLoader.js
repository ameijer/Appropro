/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: databaseLoader.js
 * @Last modified time: 2017-01-27T13:01:40-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



var workflow = new(require('events').EventEmitter)();;
var fs = require('fs');
var mongoose = require('mongoose');
var dir = 'appropro/'
var officeIdToLoad = "576481c1e8f324847c2b7788";


var Subcommittee = require('../../schema/Subcommittee')(null, mongoose);
var CongressionalOffice = require('../../schema/CongressionalOffice')(null, mongoose);
var WorkflowItem = require('../../schema/WorkflowItem')(null, mongoose);
var AppropSettings = require('../../schema/AppropSettings')(null, mongoose);

// Use connect method to connect to the Server
mongoose.connect('mongodb://node_client:noddr.JS@localhost:27017/appropro_obj?ssl=true&sslValidate=false', function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        //HURRAY!! We are connected. :)
        console.log('Connection established to db');

        workflow.emit('initAppSettings');
    }
});
var locked = 0;
//scan in json
workflow.on('scan', function() {
    workflow.office = officeIdToLoad;
    readFiles(dir, function(filename, content) {
        workflow.emit('loadWorkflowItems', filename, JSON.parse(content), filename.indexOf('import') > -1);
    }, function(error) {
        throw err;
    });

});

workflow.on('loadWorkflowItems', function(filename, content, isImport) {
    //content is json array of individual workflow items to load into DB
    var toCheck = content.length;
    var unlocked = true;
    var callbacks = new Array();
    var newContent = new Array();
    var done = function() {


        // if(++locked == 1){
        //   locked = true;
        //   workflow.emit('initAppSettings', filename, newContent);
        // } else {
        workflow.emit('fork', filename, newContent);
        // }
    };

    var runner = function(async) {
        async.parallel(callbacks, done);
    }

    var async = require('async');

    content.forEach(function(item) {
        var workFlow = new WorkflowItem(item);
        workFlow.office = officeIdToLoad;

        if (isImport) {
            workFlow.flow = "IMPORT";

        } else {
            workFlow.flow = "CREATE";
        }

        var asyc = function(callback) {
            //check for existence
            WorkflowItem.find({
                office: workFlow.office,
                flow: workFlow.flow,
                name: workFlow.name
            }, function(err, results) {
                if (err) throw err;
                if (!results || results.length === 0) {
                    //then we can add in
                    workFlow.save(function(err, saved) {
                        if (err) throw err;
                        console.log('successfully saved workflow item: ' + saved.name + " with id: " + saved._id);
                        newContent.push(saved);

                        // if(success === toCheck){
                        //     workflow.emit('initAppSettings', filename, content);
                        // }
                        callback(null);
                    });
                } else {
                    newContent.push(results[0]);
                    //already have it
                    console.log('skipping duplicate workflow item: ' + workFlow.name + ' for office: ' + workFlow.office);
                    // success++;
                    // if(success === toCheck){
                    //     workflow.emit('initAppSettings', filename, content);
                    // }
                    callback(null);
                }

            });
        };
        callbacks.push(asyc);


        toCheck--;
        if (toCheck < 1 && unlocked) {
            unlocked = false;
            runner(async);
        }
    });




});

workflow.on('initAppSettings', function() {

    CongressionalOffice.findById(officeIdToLoad, function(err, office) {
        if (err) throw err;

        if (!office.appropSettings) {
            var appropSettings = new AppropSettings();
            appropSettings.office = office;
            appropSettings.save(function(err, saved) {
                if (err) throw err;

                CongressionalOffice.update({
                    _id: office._id
                }, {
                    appropSettings: saved
                }, {
                    safe: true,
                    upsert: true
                }, function(err, updated) {
                    if (err) throw err;
                    workflow.emit('scan');
                });

            });
        } else {
            //already have approp settings
            workflow.emit('scan');
        }
    });
});


workflow.on('fork', function(filename, content) {
    //fork workflow depending on what kind of workflow we are building
    if (filename.indexOf('import') > -1) {
        //then this is a workflow for importing letters
        workflow.emit('addImportWorkflow', content);
    } else {
        //this is a workflow for creating letters
        workflow.emit('addCreateWorkflow', content);
    }
});


workflow.on('addImportWorkflow', function(content) {
    if (!content || content.length == 0) throw 'bad content import: ' + JSON.stringify(content);
    AppropSettings.update({
        office: workflow.office
    }, {
        workFlowImport: content
    }, {
        safe: true,
        upsert: true
    }, function(err, doc) {
        if (err) throw err;
        console.log('successfully added import workflow for office: ' + workflow.office);
    });
});

workflow.on('addCreateWorkflow', function(content) {
    if (!content || content.length == 0) throw 'bad content create: ' + JSON.stringify(content);
    AppropSettings.update({
        office: workflow.office
    }, {
        workFlowCreate: content
    }, {
        safe: true,
        upsert: true
    }, function(err, doc) {
        if (err) throw err;
        console.log('successfully added create workflow for office: ' + workflow.office);

    });
});

function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function(filename) {
            fs.readFile(dirname + filename, 'utf-8', function(err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(filename, content);
            });
        });
    });
}
