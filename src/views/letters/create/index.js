/**
* @Date:   2017-01-15T22:06:07-05:00
* @Filename: index.js
* @Last modified time: 2017-01-29T16:30:09-05:00
* @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
* @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
*/



(function(){
'use strict';

var multiparty = require('multiparty');
var Promise = require("bluebird");
var fs = require("fs");
var mammoth = require('mammoth');

exports.init = function(req, res, next) {
	 res.render('letters/create/index');
};

var errorMessages = {
	'conflictingDocument': 'Letter title conflicts with an existing letter.',
	'unsupportedFileType': 'Unsupported file type.'
};


/* writeFile(fileToWrite)
 *
 * @input fileObject
 *
 * @promises pathname of written file
 */

function writeFile(fileToWrite){
	var writePromise = new Promise(function(resolve, reject){
		var wstream;
		//TODO: ajh var srcFile = '/tmp/' + fileToWrite.name;

		var splitPath = fileToWrite.path.split('.');
		var docType = splitPath.pop();
		var docName = splitPath.shift();

		if(docType !== "docx") {
			return reject(docType);
		}

		var tempName = docName + '_write.' + docType;

		wstream = fs.createWriteStream(tempName);
		fileToWrite.pipe(wstream);

		wstream.on('finish', function() {
			// Check if doc type is supported.

			return resolve(tempName);
		});

		wstream.on('error', function(){
			return reject('Error writing file.');
		});

	});

	return writePromise;
}

/* createPadForOffice
 * @input office: lead office
 * @input newLetter: mongoose model of created letter
 * @input html: if the user is importing a document, the html is provided here.
 *
 * @promises the updated letter, as returned by etherClient.createPadForOffice(err, letter)
 */

function createPadForOffice(etherClient, office, newLetter, html){
	var createPadPromise = new Promise(function(resolve, reject){
		etherClient.createPadForOffice(office, newLetter, function(err, letter){

			if (err) {
				return reject('Error creating pad.');
			} else {
				console.log('pad' + letter.etherPadID + ' saved successfully');

				if(html){
					etherClient.setPadHTML(letter.etherPadID, html);
				}

				return resolve(letter);
			}
		});
	});

	return createPadPromise;
}



var workflowType = 'create' || 'import';

/* getOfficeWorkflowTemplate
 *
 * @input workflowType which workflow is being used?
 *
 * @promises mongoose model of the retrieved workflow settings for this office
 */

function getOfficeWorkflowTemplate(req, office, workflowName){
	var appropSettingsId = office.appropSettings._id || office.appropSettings;
	return req.app.db.models.AppropSettings.findOne(
		{
			_id: appropSettingsId
		}
	).populate('workflows workflows.steps')
	.exec()
	.then(function(settings){

		if(!settings){
			return reject('Workflow settings not found.');
		}

		var workflow = settings.lookupByName(workflowName);

		return workflow;
	})
	.catch(function(err){
		return Promise.reject(err);
	});
}

/*
 * instantiateWorkflow
 * @input req
 * @input workflowName - name of the workflow template to use. Create and Import are defaults for every office
 * @input letter - LetterItem that points to this workflow instance
 *
 * Creates a new workflow from the given template, attaches the id to the letterItem, and then persists the workflow.
 *
 */

function instantiateWorkflow(req, workflowName, letter) {

	return getOfficeWorkflowTemplate(req, req.user.office, workflowName)//then
	.then(function(workflowTemplate){
		return workflowTemplate.buildInstanceFromTemplate();
	})
	.then(function(workflowInstance){
		letter.workflow = workflowInstance._id;

		 return workflowInstance.save();
	 })
	 .then(function(savedWorkflow){
		return letter.save();
	 })
	 .catch(function(err){
		return Promise.reject(err);
	 });
}

/* parseForm
 *
 * @input req -
 *
 * @promises -
 * 		body: {
 * 			fieldA: ...,
 *			fieldB: ...,
 *			...: ...,
 *			documentFile: FileObject,
 *		}
 */

function parseForm(req){
	var parsePromise = new Promise(function(resolve,reject){
		var form = new multiparty.Form({
			autoForms: true,
			uploadDir: 'uploaded'
		});

		// Errors may be emitted
		// Note that if you are listening to 'part' events, the same error may be
		// emitted from the `form` and the `part`.
		form.on('error', reject);

		// Close emitted after form parsed
		form.on('close', function() {
		});

		// Parse req
		form.parse(req, function(err, fields, files){
			if(err) {
				return reject(err);
			}

			var body;
			body = JSON.parse(fields['letter-info'][0]);

			if(files && files.letterFiles && (0 < files.letterFiles.length)){
				body.documentFile = files.letterFiles[0];
			} else {
				body.documentFile = null;
			}

			return resolve(body);
		});
	});

	return parsePromise;
}


/* parseBodyForLetter(req, newLetter)
 *
 * @input req - REST request
 * @input newLetter - object that will hold the parsed information.
 * 		Will be used to initialize a LetterItem
 *
 * @returns newLetter object (modified input object)
 */

function parseBodyForLetter(req, body){
	delete body.id;
	delete body._id;

	if(body.offices){
		body.offices.lead = null;
	}

	//Begin adding fields, change name from body to letter.
	var letter = body;

	//link author to letter
	var stateHolder = {};

	stateHolder.stage = 'Created';
	stateHolder.rUser = req.user._id;

	//DIFFERENCES
	letter.status = [stateHolder];
	letter.offices.lead = req.user.office;

	//END Differences
	if(!req.body.dateIntroduced){
		letter.dateIntroduced = Date.now();
	}

	var letterDocument = new req.app.db.models.LetterItem(letter);
	//var letterDocument = new req.app.db.models.LetterItem();

	return letterDocument;
}

function transformElement(element) {
	if (element.children) {
		element.children.forEach(transformElement);
	}

	if (element.type === "paragraph") {
		if (element.alignment === "center" && !element.styleId) {
			element.styleName = "center";
		}
	}
	return element;
}


/* convertFileToHTML(srcFilePath)
 *
 * @input srcFilePath - path to the letter's file
 *
 * @promises html converted from letter document
 */

function convertFileToHTML(srcFilePath){
	var html = '';

	var options = {
				  styleMap: [
					  "p[style-name='center'] => center",
					  "p[style-name='Heading 1'] => p:fresh > h1:fresh",
					  "p[style-name='Heading 2'] => p:fresh > h2:fresh",
					  "p[style-name='Heading 3'] => p:fresh > h3:fresh",
					  "p[style-name='Heading 4'] => p:fresh > h4:fresh",
					  "p[style-name='Heading 5'] => p:fresh > h5:fresh",
					  "p[style-name='Heading 6'] => p:fresh > h6:fresh"
				  ],
				  transformDocument: transformElement,
				  ignoreEmptyParagraphs: true
			  };

	var convertPromise = mammoth.convertToHtml({
			path: srcFilePath
		}, options
	).then(function(result) {
		html = "<!doctype html>\n<html lang=\'en\'>\n<body>\n"+result.value+"\n</body>\n</html>\n";
	}).catch(function(e) {
		console.warn("Mammoth failed to import this file: " + srcFilePath);
		console.warn(JSON.stringify(e));
		html = '';
	}).finally(function(){
		return html;
	});

	return convertPromise;
}

//New Letter
exports.newLetter = function(req,res,next){
	var etherClient = req.app.etherClient;
	//we assign ids

	var body;
	var file;
	var html;

	var creationType = 'Created';

	parseForm(req).then(function(results){
		if(typeof req.user.office === 'string') {
			return req.app.models.CongressionalOffice.find(req.user.office)
				.exec()
				.then(function(office){
					req.user.office = office;

					return results;
				});
		} else {
			return results;
		}
	}).then(function(results){
		body = results;
		file = results.documentFile;

		var letter = parseBodyForLetter(req, body);

		return req.app.db.models.LetterItem.validateAndCreate(letter);
	})
	.then(function(letter) {

		//office might be populated (full object reference) or unpopulated (String reference)
		// This depends on how ensureLoggedIn is attaching the user.

		if(file){
			var convertPromise = convertFileToHTML(file.path).then(
				function(html){
					return createPadForOffice(etherClient, req.user.office, letter, html);
				}
			).catch(function(err){
				//unable to convert file to html
				return createPadForOffice(etherClient, req.user.office, letter, null);
			});

			creationType = 'Imported';

			return convertPromise;
		} else {
			return createPadForOffice(etherClient, req.user.office, letter, null);
		}
	})
	.then(function(letter){
		return instantiateWorkflow(req, creationType, letter);
	})
	.then(function(updatedLetter){
		return res.json({'docId': updatedLetter.etherPadID, '_id' : updatedLetter.id});
	})
	.catch(function(err){
		console.log(err);
		res.status(500);

		//TODO: Destroy the letter, it wasn't created properly!'
		letter.remove().exec() //then
		 .then(function(removed){
			return res.send(err);
		 }).catch(function(removeError){
		 	console.log(err, removeErr);
			res.send(removeErr);
		 });

		return res.send(err);
	});
};//END newLetter

})();
