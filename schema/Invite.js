exports = module.exports = function(app, mongoose) {
var Invite = new mongoose.Schema({
	invitor: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	status: String,
	office: {type: mongoose.Schema.Types.ObjectId, ref: 'CongressionalOffice'},
	inviteRole: String, //Admin or Account
	invited: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	code: String,
	dateUsed: Number
});

module.exports = mongoose.model('Invite', Invite);

//app.db.model('Note', noteSchema);
 if(app && app.db){
	 app.db.model('Invite', Invite);
 } else if(mongoose){
 	return mongoose.model('Invite', Invite);
 }
};
