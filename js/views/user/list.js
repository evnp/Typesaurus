define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/user/list.html'

], function($, _, Backbone, userListTemplate){

    var userListView = Backbone.View.extend({

        el: $("#page"),

        initialize: function(){
        },

        render: function(){
            var data = {};
            var compiledTemplate = _.template( userListTemplate, data );
            this.el.html( compiledTemplate ); 
        }
    });

    return new userListView;
});
