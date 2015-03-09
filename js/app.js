/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var app = angular.module('Contacts', ['ui.bootstrap.modal', 'ui.bootstrap.dropdown', 'ui.bootstrap.tooltip']);

app.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
});

app.controller('ContactController', function ($scope, $http, $sce) {
	$scope.contacts = [];
    $scope.modalTitle = '';
    $scope.validUser = "no";
    
    $scope.user = '';
    $scope.storage = '';	
    $scope.path = 	
    $scope.prefix = "vcard_";
    var CREATE = 0;
    var UPDATE = 1;
        
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
    $scope.status = {
    	    isopen: false
	};

	$scope.toggled = function(open) {
		$log.log('Dropdown is now: ', open);
	};

	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};
        
    // Simply search contacts list for given id
    // and returns the contact object if found
    $scope.get = function (id) {
        for (i in $scope.contacts) {
            if ($scope.contacts[i].id == id) {
                return $scope.contacts[i];
            }
        }
    };
       
    $scope.login = function() {
    	 $scope.authenticationModal = true;	 
    };
    
    $scope.hasAuthenticated = function(value) {
        //alert(value);
        return "yes"==value;
    };
    
    $scope.add = function() {
    	$scope.modalTitle = "New Contact";
    	$scope.editContactModal = true;
    	$scope.isFocused = true;
    };
    
    $scope.addProfile = function() {
    	$scope.modalTitle = "Create Profile";
    	$scope.noteTitle = "Warning: you currently do not have a profile, please create one!";
    	$scope.editProfileModal = true;
    	$scope.isFocused = true;
    };
    
    $scope.edit = function(id) {
    	$scope.modalTitle = "Edit Contact";
    	$scope.editContactModal = true;
    	$scope.newcontact = angular.copy($scope.get(id));
    	$scope.isFocused = true;
    };
    
    $scope.editProfile = function() {
    	$scope.contact = angular.copy($scope.get(0));
    	if($scope.contact == undefined){
   			$scope.addProfile();
   		}else{
	    	$scope.modalTitle = "Edit Profile";
	    	$scope.noteTitle = "";
	    	$scope.editProfileModal = true;
	    	$scope.newcontact = angular.copy($scope.get(0));
	    	$scope.isFocused = true;
   		}
    };
    
    $scope.view = function(id) {
   		$scope.modalTitle = "View Contact";
    	$scope.viewContactModal = true;
    	$scope.viewcontact = angular.copy($scope.get(id));
    };
    
    $scope.viewProfile = function() {
    	$scope.contact = angular.copy($scope.get(0));
    	if($scope.contact == undefined){
   			$scope.addProfile();
   		}else{
	    	$scope.modalTitle = "Me";
	    	$scope.viewProfileModal = true;
	    	$scope.viewcontact = angular.copy($scope.get(0));
   		}
    };
    
    $scope.save = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
    		//generate unique id
            newcontact.id = new Date().getTime();
            $scope.insertContact(newcontact, CREATE);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in $scope.contacts) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact, UPDATE);
                }
            }
        }
    	
    	$scope.editContactModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
        
    $scope.saveProfile = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
            newcontact.id = 0; // Generate unique id
            $scope.insertContact(newcontact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in $scope.contacts) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact);
                }
            }
        }
    	
    	$scope.editProfileModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeEditor = function() {
    	$scope.editContactModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeProfileEditor = function() {
    	$scope.editProfileModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeViewer = function() {
    	$scope.viewContactModal = false;
    	$scope.viewcontact = {};
    };
    $scope.closeProfileViewer = function() {
    	$scope.viewProfileModal = false;
    	$scope.viewcontact = {};
    };
    
    $scope.closeAuth = function() {
    	$scope.authenticationModal = false;
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
        	$scope.validUser = "yes";
            notify('Success', 'Authenticated user.');
        } else {
            notify('Failed', 'Authentication failed.');
        }
    };
        
    // Listing contact resources
    $scope.load = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched($scope.path + '*',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), VCARD('Individual'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					var sId = id.split("_"); 
					
					var fullname = g.anyStatementMatching(evs[e]['subject'], VCARD('fn'))['object']['value'];
					
					var email = g.anyStatementMatching(evs[e]['subject'], VCARD('hasEmail'))['object']['value'];
					var sEmail = email.split(":");
					
					var phone = g.anyStatementMatching(evs[e]['subject'], VCARD('hasTelephone'))['object']['value'];
					var sPhone = phone.split(":");
					
					var contact = {
					    id: sId[1],
					    fullname: fullname,
					    email: sEmail[1],
					    phone: sPhone[1] 
					};
					$scope.contacts.push(contact);
                    $scope.$apply();
                }
			}
	    });
    };
    
    // Getting user storage
    $scope.getStorage = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    var uri = $scope.user.slice(0,$scope.user.length-3);
	    
	    f.nowOrWhenFetched(uri ,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
			var FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
	
			var evs = g.statementsMatching(undefined, RDF('type'), FOAF('Person'));
			if (evs != undefined) {
				for (var e in evs) {
					var s = g.anyStatementMatching(evs[e]['subject'], SPACE('storage'))['object']['value'];
					
					$scope.storage = s;
                    $scope.$apply();
                }
			}
			
			$scope.isContactsContainer();
	    });
	    
	    
    };
    
    // Insert or update a contact resource
    $scope.insertContact = function (contact, operation) {
	    var uri = $scope.path + $scope.prefix + contact.id;
        var resource = $scope.composeRDFResource(contact, uri);
        $http({
          method: 'PUT', 
          url: uri,
          data: resource,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            if(operation == CREATE){
            	notify('Success', 'Resource created.');
            	//update view
            	$scope.contacts.push(contact);
            }
            else 
            	notify('Success', 'Resource updated.');
           
            $scope.newcontact = {};
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
            notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
            notify('Failed '+ status + data);
          }
        });
    };
    
    // Create contacts container
    $scope.createContactsContainer = function (str) {
    	var uri = str.slice(0, str.length-1);
		$http({
          method: 'PUT', 
	      url: uri,
          data: '',
          headers: {
            'Content-Type': 'text/turtle',
			'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            notify('Success', 'Your contacts container has been created at '+str);
            $scope.path = str;
            //fetch user data
            $scope.load();
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
            notify('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
            notify('Failed: '+ status + data);
          }
        });
    };
    
    // Iterate through contacts list and delete
    // contact if found
    $scope.remove = function (contact) {
        var uri = $scope.path + $scope.prefix + contact.id;
    	$http({
    	      method: 'DELETE',
    	      url: uri,
    	      withCredentials: true
    	    }).
    	    success(function(data, status, headers) {
    	      if (status == 200) {
    	    	notify('Success', 'Resource deleted.');
    	        //update view
    	    	var indexOf = $scope.contacts.indexOf(contact);
    	    	if (indexOf !== -1) {
    	    		$scope.contacts.splice(indexOf, 1);
    	    	}
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  notify('Forbidden', 'Authentication required to delete '+uri);
    	      } else if (status == 403) {
    	    	  notify('Forbidden', 'You are not allowed to delete '+uri);
    	      } else if (status == 409) {
    	    	  notify('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  console.log('Failed '+status, data);
    	      }
    	});
    	
        if ($scope.newcontact.id == contact.id) $scope.newcontact = {};
    };
       
    // Check if contacts dir exists, if not create it
    $scope.isContactsContainer = function () {
    	var uri = $scope.storage + "contacts/";
        $http({
          method: 'HEAD',
          url: uri,
          withCredentials: true
        }).
        success(function(data, status, headers) {
          //add dir to storage
          //console.log("Contacts container found");
          $scope.path = uri;
          //fetch user data
          $scope.load();
       
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create a directory for: '+$scope.user);
          } else if (status == 403) {
        	  notify('Forbidden', 'You are not allowed to access storage for: '+$scope.user);
          } else if (status == 404) {
        	  //console.log('Contacts container not found...', 'creating it');
        	  //create contacts container
        	  $scope.createContactsContainer(uri);
          } else {
        	  notify('Failed - HTTP '+status, data, 5000);
          }
        });
    };
      
    // Composes an RDF resource to send to the server
    $scope.composeRDFResource = function (contact, uri) {
       var rdf =   "<" + uri + ">\n" +
          "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://www.w3.org/2006/vcard/ns#Individual> ;\n" +
          "<http://www.w3.org/2006/vcard/ns#fn> \"" + contact.fullname + "\" ;\n" +
          "<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + "> ;\n" + 
          "<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + "> .\n";
       return rdf;
    };
       
    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
            $scope.authenticate(e.data.slice(5, e.data.length));
            $scope.user = e.data.slice(5);
            //get user storage and assign contacts dir
            $scope.getStorage();
        }
        
        $scope.closeAuth();
    },false);
});
