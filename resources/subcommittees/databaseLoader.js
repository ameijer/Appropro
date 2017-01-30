var workflow = new (require('events').EventEmitter)();;
var fs = require('fs');
var mongoose = require('mongoose');
var dir = 'approps/'

var Subcommittee = require('../../schema/Subcommittee')(null, mongoose);
var CongressionalOffice = require('../../schema/CongressionalOffice')(null, mongoose);


// Use connect method to connect to the Server
mongoose.connect('mongodb://node_client:noddr.JS@localhost:27017/appropro_obj?ssl=true&sslValidate=false', function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to db');
   
    workflow.emit('scan');
    }

});

//scan in json
workflow.on('scan', function() {

	readFiles(dir, function(filename, content) {
	  workflow.emit('linkChair', JSON.parse(content));
	}, function(error) {
	  throw err;
	});

});

//replace first/last names with db refs
workflow.on('linkChair', function(readData) {
	var subcomm = readData;
	var last = readData.chair.last;
	var first = readData.chair.first;
	CongressionalOffice.find({'name.last' : last}, function (err, docs) {
		if(err) throw err;

  // docs is an array
		if(docs.length > 1){
			console.log('found ' + docs.length + ' matches for last name: ' + last);
			CongressionalOffice.find({'name.last' : last, 'name.first' : first}, function (err, docs) {
				if(err) throw err;
				if(docs.length > 1){
					throw 'too many matches in db for first name: ' + first + ' and last name: ' + last;
				}

				readData.chair = docs[0];
				workflow.emit('linkRanking', readData);
			});

		} else {
			console.log('only found 1 match for last name: ' + last);
			readData.chair = docs[0];
			workflow.emit('linkRanking', readData);
		}
	});

});

workflow.on('linkRanking', function(readData) {
	var subcomm = readData;
	var last = readData.rankingMember.last;
	var first = readData.rankingMember.first;
	CongressionalOffice.find({'name.last' : last}, function (err, docs) {
		if(err) throw err;

  // docs is an array
		if(docs.length > 1){
			console.log('found ' + docs.length + ' matches for last name: ' + last);
			CongressionalOffice.find({'name.last' : last, 'name.first' : first}, function (err, docs) {
				if(err) throw err;
				if(docs.length > 1){
					throw 'too many matches in db for first name: ' + first + ' and last name: ' + last;
				}

				readData.rankingMember = docs[0];
				workflow.emit('store', readData);
			});

		} else {
			console.log('only found 1 match for last name: ' + last);
			readData.rankingMember = docs[0];
			workflow.emit('store', readData);
		}
	});

});


//save to database
workflow.on('store', function(filledRefs) {
	var committee = new Subcommittee(filledRefs);
	committee.save(function(err) {
    // we've updated the dog into the db here
    if (err) throw err;
		console.log('successfully saved subcommittee: ' + filledRefs.nickname);
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
