define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/main.html',
    'views/editor',
    'views/controls',
    'views/word/definitions'

], function($, _, Backbone, mainTemplate,
            EditorView, ControlsView, DefinitionView){

    var MainView = Backbone.View.extend({

        el: '#content',

        render: function(){
            this.$el.html(mainTemplate);

            var editor = (new EditorView).render();
            (new ControlsView).render(editor);
            (new DefinitionView).render();
        }
    });

    return MainView;
});
