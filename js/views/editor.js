define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',

    'collections/words',
    'views/word/synonyms',
    'text!templates/editor.html'

], function($, _, Backbone, jQueryHotkeys,
  wordCollection, synonymView, editorTemplate) {

    var editorView = Backbone.View.extend({

        el: $('#editor'),

        initialize: function(){
            this.words = wordCollection;
        },

        render: function(){
            var data = {
                _: _
            };

            var compiledTemplate = _.template( editorTemplate, data );
            $('#editor').html( compiledTemplate );


            // Bind synonym-menu hotkey
            this.bindHotkey();

            // Set up editor auto-resize
            this.bindAutoResize();
        },

        bindHotkey: function() {
            $('#text-area').bind('keydown', 'ctrl+shift+space', function() {
                alert('Synonyms for the word under the cursor.');

                synonymView.render(this.getCurrentWord(), this);
            });
        },

        bindAutoResize: function() {
            $(function() {
                $("#text-area").change(autoSize).keydown(autoSize).keyup(autoSize);
                autoSize();
            });

            function autoSize() {
                // Copy textarea contents; browser will calculate correct height of copy,
                // which will make overall container taller, which will make textarea taller.
                var text = $("#text-area").val().replace(/\n/g, '<br/>');
                $("#text-copy").html(text);
            }
        },

        getCurrentWord: function() {
            // User jQuery Caret position tools
        }
    });

    return new editorView;
});
