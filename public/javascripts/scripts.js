function Contact(data)
{
    var self = this;
    this._id = ko.observable(data._id);
    this.address = ko.observable(data.address);
    this.email = ko.observable(data.email);
    this.mobile = ko.observable(data.mobile);
    this.phone = ko.observable(data.phone);
    this.last_name = ko.observable(data.last_name);
    this.first_name = ko.observable(data.first_name);
    this.full_name = ko.computed(function(){
        return self.first_name() + " " + self.last_name();
    });

    this.visible = ko.observable(false);
}

function AlertViewModel() {
    var self = this;
    self.msg = ko.observable();
    self.msg_title = ko.observable;

    self.showAlert = function(message) {
        self.msg(message);
        $('#alert').slideDown(); 
    };

    self.closeAlert = function() {
        $('#alert').slideUp();
    }
}

function ContactViewModel(){
    var self = this;

    self.address = ko.observable();
    self.email = ko.observable();
    self.phone = ko.observable();
    self.mobile = ko.observable();
    self.last_name = ko.observable();
    self.first_name = ko.observable();
    self._id = ko.observable();

    self.titlelabel = ko.observable('');
    self.actionlabel = ko.observable('');
    self.contact = null;

    self.setOptions = function(options) {
        
        // Clear the dialog.
        self.address("");
        self.email("");
        self.phone("");
        self.mobile("");
        self.last_name("");
        self.first_name("");

        self.titlelabel(options.title);
        self.actionlabel(options.actionlabel);
        self.doCallback = options.action;

    }

    self.setContact = function(contact){

        self.contact = contact;
        self.address(contact.address());
        self.email(contact.email());
        self.phone(contact.phone());
        self.mobile(contact.mobile());
        self.last_name(contact.last_name());
        self.first_name(contact.first_name());
        self._id(contact._id());

        $('#view').modal('show');

    }

    self.doContact = function() {
        $('#view').modal('hide');

        self.doCallback({
            address: self.address(),
            email: self.email(),
            phone: self.phone(),
            mobile: self.mobile(),
            last_name: self.last_name(),
            first_name: self.first_name()
        }, self.contact);
    }
}

function ContactsViewModel() {
    var self = this;
    self.contactsURI = '/contacts';
    self.showSearch = false;

    // TODO: Implement Auth.
    self.username = "none"; 
    self.password = "none";

    self.contacts = ko.observableArray();
    self.searchText = ko.observable();

    self.access_token = ko.observable();

    self.accessTokenSet = ko.computed(function(){
        return self.access_token() != '';
    });

    self.ajax = function(uri, method, data) {
        //data = data?$.param(data):data;
        var request = {
            url: uri,
            type: method,
            contentType: "application/json",
            accepts: "application/json",
            cache: false,
            dataType: 'json',
            data: JSON.stringify(data),
            /* TODO: Auth
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", 
                    "Basic " + btoa(self.username + ":" + self.password));
            }, */
            error: function(jqXHR) {
                console.log("ajax error " + jqXHR.status);
            }
        };
        return $.ajax(request);
    }

    self.toggleVisible = function(contact) {
        contact.visible(!contact.visible());
    }

    self.beginAdd = function(contact) {
        contactViewModel.setOptions({
            title: 'Add a new contact',
            actionlabel: 'Add',
            action: self.add
        });
        $('#view').modal('show');
    }

    self.beginEdit = function(contact) {
        contactViewModel.setOptions({
            title: 'Edit contact',
            actionlabel: 'Update',
            action: self.edit
        });
        contactViewModel.setContact(contact);
    }

    self.edit = function(data, contact) {
        contactURI = self.contactsURI + '/' + contact._id();
        self.ajax(contactURI, 'PUT', data).done(function(res){
            if(res.success)
                self.reload();
            else
                alertViewModel.showAlert('Contact not updated.');
        });
    }
    self.view = function(contact) {
        contactURI = self.contactsURI + '/' + contact._id();
        contactViewModel.setOptions({
            title: 'Contact:  ' + contact.full_name()
        });
        self.ajax(contactURI, 'GET').done(function(data){
            contactViewModel.setContact(new Contact(data.contact));  
        });
        
    }
    self.remove = function(contact) {
        contactURI = self.contactsURI + '/' + contact._id();
        self.ajax(contactURI, 'DELETE').done(function(res){
            if(res.success)
                self.reload();
            else
                alertViewModel.showAlert('Contact not deleted.');
        });
    }
    self.add = function(contact) {
        self.ajax(self.contactsURI, 'POST', contact).done( function(data){
            if (data.success) {
                self.reload();
            } else {
                alertViewModel.showAlert('Contact not added.');
            }
        });
    }
    self.reload = function() {
        self.ajax(self.contactsURI, 'GET').done(function(data) {
            self.loadContacts(data);
        });
    }
    self.loadContacts = function(data) {
        var mappedContacts = $.map(data.contacts, function(contact){
                return new Contact(contact);
            });   
        self.contacts(mappedContacts);
    }
    self.beginSearch = function(){

        if (self.showSearch) {        
            $('.searchbox').closest('.row').slideUp(100);
        } else {   
            $('.searchbox').closest('.row').slideDown(100);
        }
        self.showSearch = !self.showSearch;
    }
    self.search = function(){
        searchURI = self.contactsURI + '/search/' + self.searchText();
        self.ajax(searchURI, 'GET').done(function(data){
            self.loadContacts(data);
        });
    }

    self.beginSyncPull = function(){
        if(self.access_token() != '') {
            self.ajax(self.contactsURI + '/fetch/' + self.access_token(), 'GET').done(function(data){
                if(data.success == 1) {
                    alertViewModel.showAlert("Contacts imported successfully.");
                    self.reload();
                }
                else 
                    alertViewModel.showAlert("Error while importing contacts.");
            });
        }
    }

    self.beginSyncPush = function(){
        if(self.access_token() != '') {
            self.ajax(self.contactsURI + '/push/' + self.access_token(), 'POST').done(function(data){
                if(data.success == 1) {
                    alertViewModel.showAlert("Contacts pushed into Google successfully.");
                    self.reload();
                }
                else 
                    alertViewModel.showAlert("Error while exporting contacts.");
            });
        }
    }

    self.beginAuth = function() {
        top.location = '/auth';
    }
    self.setToken = function(token)
    {
        self.access_token(token);
    }

    self.reload();
}