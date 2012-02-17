define([
    'jQuery',
    'Underscore',
    'Backbone',

    'text!templates/home/main.html'

], function($, _, Backbone, homepageTemplate){

    var homepageView = Backbone.View.extend({
        el: $("#page"),

        render: function(){
            this.el.html(homepageTemplate);
        }
    });

    return new homepageView;
});
