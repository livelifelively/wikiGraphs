
define(['vendor/backbone', 'kinvey', 'app'], function (Backbone, Kinvey, App) {
  var LoginModel = Backbone.Model.extend({
	urlRoot: '/login',
	defaults: {
		username: 'Username',
		password: 'Password'
	}
  });
  
  return LoginModel;
});