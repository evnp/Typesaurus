define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',

    'text!templates/main.html',
    'views/editor',
    'views/controls',
    'views/word/definitions'

], function($, _, Backbone, jQueryHotkeys,
            mainTemplate, EditorView, ControlsView, DefinitionView){

    var MainView = Backbone.View.extend({

        el: '#content',

        render: function(){
            this.$el.html(mainTemplate);

            (new ControlsView).render((new EditorView).render());
            (new DefinitionView).render();
        }
    });

    return MainView;
});
