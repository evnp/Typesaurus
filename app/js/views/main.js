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

            var underMaintenance = true;
            if (underMaintenance) {
                this.$('#controls').html(
                    '<p>&nbsp;&nbsp;is currently under maintenance,' +
                    ' and will be back up shortly.</p>'
                );
                this.$('#credits').hide();

            } else {
                (new ControlsView).render((new EditorView).render());
                (new DefinitionView).render();
            }
        }
    });

    return MainView;
});
