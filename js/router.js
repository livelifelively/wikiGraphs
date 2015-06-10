define([
  'jquery',
  'vendor/backbone',
  'kinvey',
  'app'
], function ($, Backbone, Kinvey, App) {
		var ApplicationRouter = Backbone.Router.extend({
			routes: {
				"": "home",
				"home": "home",
				"loginSignup": "loginSignup",
				"logout": "logout"
			},
			
			page: {
				home: {
					instance: {},
					needsLoggingIn: true,
					blockId: "page_home",
					instanceId: 'home',
					viewFile: 'homeView'
				},
				loginSignup: {
					instance: {},
					needsLoggingIn: false,
					blockId: "page_loginSignup",
					instanceId: 'loginSignup',
					viewFile: 'loginSignupView'
				}
			},
			
			// check ups on what is required by the page.
			checkups: function(pageId){
				// check if needs logging in and other requirements
				// TODO : should be a chain of && for all conditions to be satisfied.
				if (this.page[pageId].needsLoggingIn){
					return App.ensureLogin();					
				}
				return true;
			},
			
			home: function(){
				this.renderRouteContentView(
					this.page.home.viewFile, 
					this.page.home.instanceId, 
					this.page.home.blockId
				);
			},
			
			// TODO: LOGIN SHOULD BE A HARD REFRESH. NOT A PART OF ONE APP.
			loginSignup: function(){
				this.renderRouteContentView(
					this.page.loginSignup.viewFile, 
					this.page.loginSignup.instanceId, 
					this.page.loginSignup.blockId
				);
			},
			
			logout: function(){
				var self = this;
				var user = Kinvey.Backbone.getActiveUser();
				if (null !== user) {
					var promise = user.logout({
						success: function(model, response, options) {
							App.ensureLogin();
						}
					});
				}
			},
			
			redirectToLogin : function(){
			  window.location = window.location.origin + "#loginSignup";
			},
			
			redirectToLoggedInLanding : function(){
			  window.location = window.location.origin;
			},
			
			renderRouteContentView: function(viewFile, instanceId, blockId){
				var self = this;
				var blockDivObject = $("#"+blockId);
				var blockDiv = $("<div id='"+blockId+"'></div>");
				
				if (!this.checkups(instanceId)){
					this.redirectToLogin();
					return true;
				}
				require([viewFile], function(viewObject){
					if (!(self.page[instanceId].instance instanceof viewObject)){
						self.page[instanceId].instance = new viewObject();
					}
					
					// fetch the element for the loginSignup div
					if (!(blockDivObject.length)){
						$("#main").html("");
						blockDivObject = blockDiv.appendTo("#main");
					}
					blockDivObject.html(self.page[instanceId].instance.render().el);
				});
			}
		});
		
		return ApplicationRouter;
	}
);