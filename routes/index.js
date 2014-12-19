var express = require('express');
var router = express.Router();
var querystring = require('querystring');


// Google OAuth variables
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// Application identifiers and keys
var CLIENT_ID = '586382836389-a5l3345c2f4vs04ooprilib69ar7l7sn.apps.googleusercontent.com';
var CLIENT_SECRET = 'Lz5tGz0Theirdg0gnyxyE-bu';
var REDIRECT_URL = 'https://cloudguest116.niksula.hut.fi:8080/auth';

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

// generate a url that asks permissions for Google Contacts
var scopes = ['https://www.google.com/m8/feeds', 'https://www.googleapis.com/auth/userinfo.email'];

var urlContacts = oauth2Client.generateAuthUrl({
  access_type: 'offline', // will return a refresh token
  scope: scopes // can be a space-delimited string or an array of scopes
});

router.get('/auth', function(req, res) {
	var code = req.query.code;
	if(code)
	{
		console.log('Got code: ' + code);
		oauth2Client.getToken(code, function(err, tokens) {
	  		console.log('Got tokens:' + tokens);
	  		oauth2Client.setCredentials(tokens);
	  		res.redirect('/?access_token=' + querystring.escape(tokens.access_token));
  		});
		
	} else {
		res.redirect(urlContacts);
		console.log(urlContacts);
	}
	
});

/* GET home page. */
router.get('/', function(req, res) {
  
  var access_token = req.query.access_token;
  if(access_token){
  	console.log(access_token);
  }
  else
  	access_token = "";

  res.render('index', { 
  	title: 'Agenda de contactos :D',
  	tokens: JSON.stringify(access_token)
  	});
});

module.exports = router;
