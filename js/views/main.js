define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/main.html',
    'views/editor'

], function($, _, Backbone, mainTemplate, editorView){

    var mainView = Backbone.View.extend({
        el: $("#content"),

        render: function(){
            this.el.html(mainTemplate);
            editorView.render();
        }
    });

    return new mainView;
});
