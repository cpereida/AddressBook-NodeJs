// /db/db.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

// Create your schemas and models.
var ContactSchema = new Schema({
	first_name: String ,
	last_name: String,
	phone: String,
	mobile: String, 
	email: String, 
	address: String,
});

// Export model to use on contacts.js
module.exports = mongoose.model('Contact', ContactSchema);
