define(['vendor/backbone', 'kinvey', 'app', 'module/model/login', 'text!module/html/loginSignup.html'], function (Backbone, Kinvey, App, LoginModel, SignupHtml) {
  "use strict";
  
  var LoginView = Backbone.View.extend({
    tagName: "form",
    id: "signUpLogin",
    model: LoginModel,
    template: _.template(SignupHtml),

    events: {
      "click #signUpSubmit"  : "signUp",
      "click #loginSubmit"  : "login",
      "click #signUpToLogin" : "toggleView",
      "click #loginToSignUp" : "toggleView",
      "keydown" : "respondKeyDown"
    },

    keyDownResponse : {
      //  key code : response function
      '13' : 'onEnterKey'
    },
  
    respondKeyDown : function(e){
      if (this.keyDownResponse[e.keyCode]){
        this[this.keyDownResponse[e.keyCode]](e);
      }
      // console.log(Kinvey.history)
    },
  
    // need to cut the broilerplate code and make a good function out of this.
    onEnterKey : function(e){
	  var target = $(e.target);
	  // TODO : to add new targets as the need arrives.
      if (target.prop("tagName").toLowerCase() == "input" || target.prop("tagName").toLowerCase() == "textarea"){
		console.log(target.closest(".formBlock").find("input.formSubmit").trigger("click"));
		// fetch its parent formBlock element and trigger submit function for that (via click would use the already built functionality).
      }
    },
  
    toggleView: function(e){
      switch(e.target.id){
        case "loginToSignUp": 
          $("#signUpLogin .login").hide();
          $("#signUpLogin .signUp").show();
          break;
        case "signUpToLogin":
          $("#signUpLogin .login").show();
          $("#signUpLogin .signUp").hide();
          break;
      }
    },
  
    render: function () {
      this.$el.html(this.template());
      return this;
    },

    login: function(){
      var user = new Kinvey.Backbone.User();
      var promise = user.login({
        username : $("#signUpLogin .login input[name='username']").val(),
        password : $("#signUpLogin .login input[name='password']").val()
      }, {
            success: function(model, response, options) {
              App.ensureLogin();
              App.router.redirectToLoggedInLanding();
            },
            error: function(err){
              console.log(err);
            }
        });
    },
  
    signUp: function (e) {
      var user = new Kinvey.Backbone.User();
      var promise = user.save({
        username : $("#signUpLogin .signUp input[name='username']").val(),
        password : $("#signUpLogin .signUp input[name='password']").val(),
        firstName : $("#signUpLogin .signUp input[name='firstName']").val(),
        lastName : $("#signUpLogin .signUp input[name='lastName']").val()
      }, {
            success: function(model, response, options) {
              App.ensureLogin();
            },
            error: function(err){
              console.log(err);
            }
      });
      return false;
    }

  });
  
  return LoginView;
});