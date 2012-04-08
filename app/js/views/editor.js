define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',

    'collections/words',
    'views/word/synonyms',
    'text!templates/editor.html'

], function ($, _, Backbone, jQueryHotkeys,
  WordCollection, synonymView, editorTemplate) {

    var editorView = Backbone.View.extend({

        el: $('#editor'),

        initialize: function () {
            this.words = WordCollection;
            this.synLists = []; // Will contain all the synonym list views that are created

            this.charWidth  = 12;
            this.lineHeight = 24;
        },

        render: function () {
            var data = {
                _: _
            };

            var compiledTemplate = _.template( editorTemplate, data );
            $('#editor').html( compiledTemplate );
            this.textarea = $('#text-area');

            // Get the actual HTMLElement out of the jQuery object
            this.textarea.el = this.textarea.get(0);

            // Set up editor auto-resize
            this.bindAutoResize();

            // Set up synonymView references
            synonymView.editor = this;
            synonymView.el = $($('#synonyms-container')[0]);

            // Bind synonym-menu hotkey and other events
            this.bindHotkeys();
        },

        bindAutoResize: function () {
            var textarea = this.textarea

            $(function () {
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

        bindHotkeys: function () {
            var editor = this;

            this.textarea.bind('keydown', 'ctrl+shift+space', function () {
                synonymView.clear(0);

                var wordInfo = editor.getCurrentWordInfo();

                if (wordInfo) {
                    var word = editor.getWordObject(wordInfo.word),
                           x = wordInfo.start * editor.charWidth,
                           y = wordInfo.line * editor.lineHeight;

                    synonymView.render(x, y, word, 0);
                }
            });

            var clearFunction = function () { synonymView.clear(0); }

            this.textarea.bind('keydown', 'space',     clearFunction);
            this.textarea.bind('keydown', 'return',    clearFunction);
            this.textarea.bind('keydown', 'backspace', clearFunction);
        },

        getCurrentWordInfo: function () {
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
                lineNo:   newlines ? newlines.length + 1 : 1 
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
        },

        getWordObject: function (wordStr) {
            console.log('Looking for ' + wordStr);
            var editor = this,
                word = editor.words.find(function (word) {
                    return word.get('is') === wordStr;
                });

            console.log('Found ' + word);

            if (!word) {
                editor.words.add({ is: wordStr }, { at: 0 });
                word = editor.words.at(0);

                // Populate the new word's synonyms with data from the api
                $.ajax('http://localhost:8080/thesaurus?word=' + wordStr, {
                    success: function (data) {
                        var wordData = data[wordStr];

                        if (wordData) {
                            word.set({ synonyms: wordData });
                        } else {
                            editor.handleNewWord(wordStr);
                        }
                    },
                    error: function (request, stat, err) { console.log(err); },
                });
            }

            console.log(word.get('is'));

            return word;
        }
    });

    return new editorView;
});
