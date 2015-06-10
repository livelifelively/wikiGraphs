/* Base backbone class to be extended upon and create other views of all logged in pages */

define(['vendor/backbone', 'kinvey', 'app'], function (Backbone, Kinvey, App) {
	"use strict";
	
	var BaseLoggedInView = Backbone.View.extend({
		
		baseEvents: {
			"click #logout" : "logout"
		},
		
		//Override this event hash in
		//a child view
		
		pageEvents: {
		
		},
		
		events : function() {
			return _.extend({}, this.baseEvents, this.pageEvents);
		},
		
		logout: function(){
			var user = Kinvey.Backbone.getActiveUser();
			if (null !== user) {
				var promise = user.logout({
					success: function(model, response, options) {
						App.ensureLogin();
						App.router.redirectToLogin();
					}
				});
			}
		}
	});
	
	return BaseLoggedInView;
});