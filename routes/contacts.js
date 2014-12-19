var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Contact = require('../db/db'); // DB model and Schemas to use within the application

var request = require('request');
var xml = require('xml');

router.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
 });

// API routes that end in /contacts
// ----------------------------------------------------

// Create a new contact (accessed at POST http://localhost:8080/contacts) 
router.post('/', function(req, res){

	var contact = new Contact();				// creates a new instance of the Contact model
	contact.first_name = req.body.first_name;	// set the contact first_name (comes from the request)
	contact.last_name = req.body.last_name;		// set the contact last_name (comes from the request)
	contact.phone = req.body.phone;				// set the contact phone (comes from the request)
	contact.mobile = req.body.mobile;			// set the contact mobile (comes from the request)
	contact.email = req.body.email;				// set the contact email (comes from the request)
	contact.address = req.body.address;			// set the contact address (comes from the request)
	
	contact.save(function(err) {	//save the contact and look for errors
		if (err)
			res.json({ success: 0 });
		else
			res.json({ success: 1 });
	});
});

// Push all contacts to Google (accessed at POST http://localhost:8080/contacts/push/:token)
router.post('/push/:token', function(req, res){
	var errors = {};
	Contact.find(function(err, contacts) {
		for(i in contacts) {					// Iterate through all our contacts in the DB
			var xmlString = xml({				// Atom XML created with our values
		    'atom:entry':
		    [
		        {
		            '_attr': {
		                'xmlns:atom': 'http://www.w3.org/2005/Atom',
		                'xmlns:gd': 'http://schemas.google.com/g/2005'
		            }
		        },
		        {
		            'atom:category': {
		                '_attr': {
		                    'scheme': 'http://schemas.google.com/g/2005#kind',
		                    'term': 'http://schemas.google.com/contact/2008#contact'
		                }
		            }
		        },
		        {
		            'gd:name': [
		                { 'gd:givenName': contacts[i].first_name },
		                { 'gd:familyName': contacts[i].last_name },
		                { 'gd:fullName': contacts[i].first_name + ' ' + contacts[i].last_name }
		            ]
		        },
		        {
		            'atom:content': [
		                {
		                    '_attr': {
		                        'type': 'text'
		                    }
		                },
		                'Notes'
		            ]
		        },
		        {
		            'gd:email': {
		                '_attr': {
		                    'rel': 'http://schemas.google.com/g/2005#work',
		                    'primary': 'true',
		                    'address': contacts[i].email,
		                    'displayName': contacts[i].first_name + ' ' + contacts[i].last_name
		                }
		            }
		        },
		        {
		        	'gd:phoneNumber': [
			        	{
			        		'_attr': {
			        			'rel': 'http://schemas.google.com/g/2005#work',
			        			'primary': 'true'
			        		}
			        	},
			        	contacts[i].phone || '0'
		        	]
		        },
		        {
		        	'gd:phoneNumber': [
			        	{
			        		'_attr': {
			        			'rel': 'http://schemas.google.com/g/2005#home',
			        		}
			        	},
			        	contacts[i].mobile || '1'
		        	]
		        },
		        {
		        	'gd:structuredPostalAddress':[
		        		{
			        		'_attr': {
			        			'rel': 'http://schemas.google.com/g/2005#work',
			        			'primary': 'true'
			        		}
		        		},
		        		{'gd:formattedAddress': contacts[i].address}
		        	]
		        }
		    ]}, true);

		    request.post(
		    {
			    url: 'https://www.google.com/m8/feeds/contacts/default/full',
			    headers: { 
			      'Authorization': 'OAuth ' + req.params.token,
			      'GData-Version': '3.0',
			      'Content-Type': 'application/atom+xml'
			    },
			    body: xmlString
		  	}, function (err, resp, body) 
		  	{
		        if (err)
		    		errors += err;
		    }); 
		}
	});
	if(errors.message === undefined)
		res.json({ success: 1 });
	else
		res.json({ success: 0 });//, error: errors });
});

// Fetch all the contacts (accessed at GET http://localhost:8080/contacts) 
router.get('/', function(req, res) {
	Contact.find(function(err, contacts) {
		if (err)
			res.json({contacts:[]});
		else
			res.json({contacts:contacts});

	});
});

// API routes that end in /contacts/search
// ----------------------------------------------------

// Fetch all the contacts with first_name = search_term (accessed at GET http://localhost:8080/contacts/search/:search_term) 
router.get('/search/:search_term?', function(req, res){
	search_term = req.params.search_term || '';
	search_term = search_term.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")
	searchregex = new RegExp(".*" + search_term + ".*", "i");
	Contact.find({ $or: [{first_name: searchregex},{last_name: searchregex}]}, function(err, contact) {
		if(contact.length <= 0) {
			res.json({ contacts: [] });
			// console.log({ message: 'No matches found.' });
		}
		else {
			if (err)
				res.json({ contacts: [] });
			else
				res.json({contacts:contact});
		}
	});
});

// Fetch one contact with _id = contact_id (accessed at GET http://localhost:8080/contacts/:contact_id) 
router.get('/:contact_id', function(req, res){
	Contact.findById(req.params.contact_id, function(err, contact) {
		//console.log(contact);
		if (contact === null || typeof contact === 'undefined') {
			res.json({contact:null});
		}
		else {
			if (err)
				res.json({contact:null});
			else
				res.json({contact:contact});
		}
	});
});

// Update a contact with _id = contact_id (accessed at PUT http://localhost:8080/contacts/:contact_id) 
router.put('/:contact_id', function(req, res) {
	Contact.findById(req.params.contact_id, function(err, contact) {
		if (contact === null) {
			res.json({ success: 0 });
			// console.log({ message: 'Contact does not exist, update failed'});
		}
		else {
			if (err)
				res.json({ success: 0 });
			else {
				contact.first_name = req.body.first_name;	// set the contact first_name (comes from the request)
				contact.last_name = req.body.last_name;		// set the contact last_name (comes from the request)
				contact.phone = req.body.phone;				// set the contact phone (comes from the request)
				contact.mobile = req.body.mobile;			// set the contact mobile (comes from the request)
				contact.email = req.body.email;				// set the contact email (comes from the request)
				contact.address = req.body.address;			// set the contact address (comes from the request)

				contact.save(function(err) {
					if (err)
						res.json({ success: 0 });
					else
						res.json({ success: 1 });
				});	
			}
		}
	});
});

// Delete a contact with _id = contact_id (accessed at DELETE http://localhost:8080/contacts/:contact_id) 
router.delete('/:contact_id', function(req, res) {
	Contact.remove({ _id: req.params.contact_id }, function(err, contact) {
		if (err)
			res.json({ success: 0 });
		else
			res.json({ success: 1 });
	});
});

// Get all contacts from Google (accessed at GET http://localhost:8080/contacts/fetch/:token)
router.get('/fetch/:token', function(req, res){
    request.get(
    {
	    url: 'https://www.google.com/m8/feeds/contacts/default/full',
	    qs: { 
	      alt:           'json', 
	      'max-results':  1000,
	      'orderby':     'lastmodified'
	    },
	    headers: { 
	      'Authorization': 'OAuth ' + req.params.token,
	      'GData-Version': '3.0'
	    }
  	}, function (err, resp, body) 
  	{
        if(resp.statusCode === 401)
	        return res.redirect('/');
  		
        var feed = JSON.parse(body);
        var data = [];
        var errors = {};
        
        var users = (feed.feed.entry || []).map(function (c) 
        {
	        var r =  {};
	        r.last_name = '';
	        r.last_name = '';

			if(c['gd$name']) //Check if name is included in the Google reply
			{
				if(c['gd$name']['gd$familyName'])
					r.last_name = c['gd$name']['gd$familyName']['$t'] || '';	// Get lastname
				if(c['gd$name']['gd$givenName'])
					r.first_name = c['gd$name']['gd$givenName']['$t'] || '';	// Get firstname
			}

			if(c['gd$phoneNumber'] && c['gd$phoneNumber'].length > 0)
			{
				r.mobile = [];
				for(i in c['gd$phoneNumber'])
					if(c['gd$phoneNumber'][i].rel && c['gd$phoneNumber'][i].rel.match('mobile'))
						r.mobile = c['gd$phoneNumber'][i]['$t'] || '';			// Get mobile phone
					else
						r.phone = c['gd$phoneNumber'][i]['$t'] || '';			// Get phone

			}

			r.email = !(c['gd$email'] && c['gd$email'][0]) && ' ' ||  c['gd$email'][0]['address'];	// Get email address

			r.address = !(c['gd$structuredPostalAddress'] && 
				c['gd$structuredPostalAddress'][0] && 
				c['gd$structuredPostalAddress'][0]['gd$formattedAddress']) && ' ' ||
				c['gd$structuredPostalAddress'][0]['gd$formattedAddress']['$t'];	// Get address

			r._id = c['id']['$t'].split('/')[8].slice(0,12);	// Get the Id from Google to avoid duplicates
			r._id = String('000000000000'+ r._id).slice(-12)
			data.push(r);	// Contact is pushed to the list
 
	    });
		
		for(i in data)	// Iterate through the previous created list
		{
			
			var contact = new Contact();							// New contact object created for each contact
		    contact.first_name = data[i].first_name;				// Set first name
		    contact.last_name = data[i].last_name;					// Set last name
		    contact.phone = data[i].phone;							// Set phone number
		    contact.mobile = data[i].mobile;						// Set mobile number
		    contact.email = data[i].email;							// Set email address
		    contact.address = data[i].address;						// Set address
		    if(data[i]._id) {
		    	contact._id = mongoose.Types.ObjectId(data[i]._id);		// Set id to avoid duplicates
		    }

		    contact.save(function(err){								// Contact is saved
		    	if(err)
		    		errors = err;
		    });
		}

		if(errors.message === undefined)
			res.json({ success: 1 });								// If errors.message is undefined, no errors during saving
		else
			res.json({ success: 0 }); //, error: errors });				// Else, success is 0 and errors are printed
    }); 
});



module.exports = router;
