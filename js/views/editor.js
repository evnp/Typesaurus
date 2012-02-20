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
                var wordInfo = editor.getCurrentWordInfo();

                if (wordInfo) {
                    var word  = wordInfo.word,
                        start = wordInfo.start,
                        line  = wordInfo.line;

                    alert(line);
                    console.log(word);
                }
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

        getCurrentWordInfo: function() {
            var lineInfo = this.getCurrentLineInfo(),
                text = lineInfo.text,
                start = end = lineInfo.caretPos,
                wordChars  = /[a-zA-Z'-]/;

            // Get the start and end boundries of the word
            while (text[start - 1] &&
                   wordChars.test(text[start - 1])) { start--; }

            while (text[end] &&
                   wordChars.test(text[end])) { end++; }

            return start === end ? null : {
                start: start,
                line:  lineInfo.lineNo,
                word:  text.substring(start, end)
            };
        },

        getCurrentLineInfo: function () {
            var text     = this.textarea.val(),
                position = this.getCaretPosition(),
                before   = text.substring(0, position),

                // Get starting index of the line
                before = text.substring(0, position),
                start = before.search(/\n.*$/) + 1,

                // Get ending index of the line
                after = text.substring(position),
                index = after.indexOf('\n'),
                end = (index !== -1 ? index : after.length) + position,

                // Get the number of the line
                newlines = before.match(/\n/g);

            return {
                text:     text.substring(start, end),
                caretPos: position - start,
                lineNo:   newlines ? newlines.length : 0
            };
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
