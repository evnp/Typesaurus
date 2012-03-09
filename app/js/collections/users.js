define([
    'jquery',
    'underscore',
    'backbone',

    'models/user'

], function($, _, Backbone, userModel){

    var userCollection = Backbone.Collection.extend({

        model: userModel,

        initialize: function(){

        }
    });
 
    return new userCollection;
});
