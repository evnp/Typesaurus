define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/main.html'

], function($, _, Backbone, mainTemplate){

    var mainView = Backbone.View.extend({
        el: $("#content"),

        render: function(){
            this.el.html(mainTemplate);
        }
    });

    return new mainView;
});
