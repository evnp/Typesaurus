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
            this.synonyms = synonymView;

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
            this.textarea.focus();

            // Get the actual HTMLElement out of the jQuery object
            this.textarea.el = this.textarea.get(0);

            // Set up editor auto-resize
            this.bindAutoResize();

            // Set up synonymView references
            this.synonyms.editor = this;
            this.synonyms.el = $($('#synonyms-container')[0]);

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
                editor.synonyms.clearLists();

                var wordInfo = editor.getCurrentWordInfo();

                if (wordInfo) {
                    var word = editor.getWordObject(wordInfo.word),
                           x = wordInfo.start * editor.charWidth,
                           y = wordInfo.line * editor.lineHeight;

                    editor.synonyms.render(word, 0, x, y);
                    editor.synonyms.source = wordInfo;
                }
            });

            // Transfer control from texarea to synonym list on 'down' arrow
            this.textarea.bind('keydown', 'down', function () {
                var list = $('#0', editor.synonyms.el);
                if (list) {
                    editor.synonyms.select($('ul li:first-child'), 1, list);
                    return false;
                } else { return true; }
            });

            // Transfer control from texarea to synonym list on number key press
            for (var i = 1; i < 6; i++) {
                this.textarea.bind('keydown', i.toString(), function (e) {
                    var list = $('#0', editor.synonyms.el);

                    if (list && list[0]) {
                        var numPressed = e.which - 48,
                            item = $('ul li:nth-child(' + numPressed + ')', list);

                        editor.synonyms.select(item, numPressed, list);
                        return false;
                    } else { return true; }
                });
            }

            var clearFunction = function () {
                synonymView.clearLists();
            }

            this.textarea.bind('keydown', 'space',     clearFunction);
            this.textarea.bind('keydown', 'return',    clearFunction);
            this.textarea.bind('keydown', 'backspace', clearFunction);
        },

        insert: function (wordStr) {
            var regex = new RegExp('((?:.*[\n]){' +
                                    (this.synonyms.source.line - 1).toString() +
                                   '}.{' + this.synonyms.source.start + '})' +
                                    this.synonyms.source.word +
                                   '([\\s\\S]*)'),
                match = this.textarea.val().match(regex);

            if (match) {
                var replacedText = match[1] + wordStr;
                this.textarea.val(replacedText + match[2]);
                this.setCaretPosition(replacedText.length);
            } else { this.textarea.focus(); }
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

        setCaretPosition: function(index) {
            this.textarea.focus();
            var el = this.textarea.el;

            if (el.setSelectionRange) {
                el.setSelectionRange(index, index);
            } else if (el.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', index);
                range.moveStart('character', index);
                range.select();
            }
        },

        getWordObject: function (wordStr) {
            var editor = this,
                word = editor.words.find(function (word) {
                    return word.get('is') === wordStr;
                });

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

            return word;
        }
    });

    return new editorView;
});
