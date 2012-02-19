define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/main.html',
    'views/editor',
    'views/controls',
    'views/word/definitions'

], function($, _, Backbone, mainTemplate,
            editorView, controlsView, defView){

    var mainView = Backbone.View.extend({
        el: $("#content"),

        render: function(){
            this.el.html(mainTemplate);
            editorView.render();
            controlsView.render();
            defView.render();
        }
    });

    return new mainView;
});
