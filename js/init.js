requirejs.config({
  shim: {
    'vendor/backbone': {
      deps: ['vendor/underscore', 'jquery'],
      exports: 'Backbone'
    },
    'vendor/underscore': {
      exports: '_'
    },
    'vendor/backbone-associations': [ "vendor/backbone" ],
    'kinvey': {
		deps: [ 'jquery', 'vendor/underscore', 'vendor/backbone' ],
		exports: 'Kinvey'
	}
  },
  paths: {
	pace: [
		'vendor/pace'
	],
    jquery: [
		"vendor/jquery"
    ],
    kinvey: [
      'vendor/kinvey'
    ],
	loginSignupView: [
		'module/view/login'
	],
	homeView: [
		'module/view/home'
	],
	text : [
		'vendor/text'
	],
	xDomainAjax : [
		'vendor/jquery.xdomainajax'
	],
	BaseLoggedInView : [
		'module/view/baseLoggedIn'
	],
	HomeModel: [
		'module/model/home'
	],
	bootstrapJS: [
		'vendor/bootstrap.min'
	],
	D3: [
		'vendor/d3.min'
	],
	topoJson: [
		'vendor/topojson'
	]
  }
});

require([
  'pace',
  'jquery',
  'vendor/underscore',
  'vendor/backbone',
  'vendor/backbone-associations',
  'kinvey',
  'app',
  'router'
], function (pace, $, _, Backbone, Associations, Kinvey, App, AppRouter) {
  
  pace.start();
  
  $(function () {
    setTimeout(function () {
      window.scrollTo(0,1);
    }, 0);
  });

  window.KINVEY_DEBUG = true;
  
  Kinvey.init({
    appKey: "kid_bkbAbNIiB",
    appSecret: "e35639058f2a4404bd525e0874fe67d1"
  })
	.then(function(activeUser){
		App.user = new Kinvey.Backbone.User(activeUser);
		App.router = new AppRouter();
		Backbone.history.start({pushState: false});
	});
});