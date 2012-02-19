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
            this.textarea = $('#text-area');

            // Get the actual HTMLElement out of the jQuery object
            this.textarea.el = this.textarea.get(0);

            // Bind synonym-menu hotkey
            this.bindHotkey();

            // Set up editor auto-resize
            this.bindAutoResize();
        },

        bindHotkey: function() {
            var editor = this;

            this.textarea.bind('keydown', 'ctrl+shift+space', function() {
                alert(editor.getCaretPosition());

                //synonymView.render(this);
            });
        },

        bindAutoResize: function() {
            var textarea = this.textarea

            $(function() {
                textarea.change(autoSize).keydown(autoSize).keyup(autoSize);
                autoSize();
            });

            function autoSize() {
                // Copy textarea contents; browser will calculate correct height of copy,
                // which will make overall container taller, which will make textarea taller.
                var text = textarea.val().replace(/\n/g, '<br/>');
                $("#text-copy").html(text);
            }
        },

        getCurrentWord: function() {
            // User jQuery Caret position tools
        },

        getCaretPosition: function () {
            var pos = 0;
            var input = this.textarea.el;

            // IE Support
            if (document.selection) {
                input.focus();
                var sel = document.selection.createRange();
                var selLen = document.selection.createRange().text.length;
                sel.moveStart('character', -input.value.length);
                pos = sel.text.length - selLen;
            }

            // Firefox support
            else if (input.selectionStart || input.selectionStart == '0')
                pos = input.selectionStart;

            return pos;
        }
    });

    return new editorView;
});
