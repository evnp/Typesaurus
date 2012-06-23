define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',

    'collections/words',
    'views/word/synonyms',
    'text!templates/editor.html'

], function ($, _, Backbone, jQueryHotkeys,
  WordCollection, SynonymView, editorTemplate) {

    var EditorView = Backbone.View.extend({

        el: '#editor',

        initialize: function () {
            this.words = new WordCollection;
            this.lineHeight = 31;
        },

        render: function () {

            var data = {
                _: _
            };

            var compiledTemplate = _.template( editorTemplate, data );
            this.$el.html( compiledTemplate );
            this.textarea = this.$('#text-area');
            this.textarea.focus();

            // Get the actual HTMLElement out of the jQuery object
            this.textarea.el = this.textarea.get(0);

            // Set up synonym view
            this.createSynonymView();

            // Set up editor auto-resize
            this.setupAutoResize();

            // Bind synonym-menu hotkey and other events
            this.setupHotkeys();
            this.setupCopyPaste();

            return this;
        },

        createSynonymView: function () {
            this.synonyms = new SynonymView;
            this.synonyms.editor = this;
        },

        setupAutoResize: function () {
            var textarea = this.textarea

            $(function () {
                textarea.change(autoSize).keydown(autoSize).keyup(autoSize);
                autoSize();
            });

            function autoSize() {
                if (textarea.val()) {
                    // Copy textarea contents; browser will calculate correct height of copy,
                    // which will make overall container taller, which will make textarea taller.
                    var text = textarea.val().replace(/\n/g, '<br/>');
                    $("#text-copy").html(text);
                }
            }
        },

        setupHotkeys: function () {
            var editor = this;

            this.switchMode(); // Default to hotkey mode

            // Transfer control from texarea to synonym list
            this.textarea.keydown('down', selectFirst);
            this.textarea.keydown('tab',  selectFirst);

            // Transfer control from texarea to synonym list on number key press
            for (var i = 1; i < 6; i++) {
                this.textarea.keydown(i.toString(), function (e) {
                    var list = $('#0', editor.synonyms.el);

                    if (list && list[0]) {
                        var numPressed = e.which - 48,
                            item = $('ol li:nth-child(' + numPressed + ')', list);

                        editor.synonyms.select(item, numPressed, list);
                        return false;
                    } else { return true; }
                });
            }

            this.textarea.keydown('space',     function () { editor.synonyms.clear; });
            this.textarea.keydown('return',    function () { editor.synonyms.clear; });
            this.textarea.keydown('backspace', function () { editor.synonyms.clear; });

            this.textarea.keydown(function (e) {
                // Covers all character keys
                if (e.which >= 54 && e.which <= 222) { editor.synonyms.clear(); }
            });

            function selectFirst() {
                var list = $('#0', editor.synonyms.el);

                if (list && list[0]) {
                    editor.synonyms.select($('ol li:first-child', list), 1, list);
                    return false;
                } else { return true; }
            }
        },

        setupCopyPaste: function () {
            var editor   = this
              , modifier = this.isOSX ? 'meta' : 'ctrl'
              , onCopy   = function () { editor.onCopy(); }
              , onPaste  = function () { editor.textarea.focus(); return true; };

            this.textarea.keydown(modifier + '+c', onCopy);
            $(document).keydown(  modifier + '+c', onCopy);
            $(document).keydown(  modifier + '+v', onPaste);
        },

        switchMode: function () {
            var editor = this;

            this.mode = this.mode === 'hotkey' ? 'auto' : 'hotkey';
            this.hotkey = this.hotkey || 'shift+space';

            if (this.mode === 'hotkey') {
                this.textarea.keydown('space', function () { editor.synonyms.clear(); });
                this.textarea.keydown(this.hotkey, function () {
                    editor.summonList(editor.getWordInfo());
                    return false;
                });
            } else if (this.mode === 'auto') {
                this.textarea.keydown('space', function () {
                    editor.summonList(editor.getWordInfo(-1));
                });
            }
        },

        summonList: function (wordInfo) {
            if (wordInfo) {
                var editor = this
                  , word = editor.words.getFrom(wordInfo.word);

                // Get the synonym view ready for a new list tree
                editor.synonyms.clear();
                editor.synonyms.context = wordInfo;
                editor.synonyms.context.wordStr = editor.synonyms.context.word;
                editor.synonyms.context.word = word;

                editor.synonyms.render(word, 0, wordInfo.x, wordInfo.y);
            }
        },

        insert: function (wordStr, type) {
            var regex = new RegExp(
                    '((?:.*[\n]){' +
                    (this.synonyms.context.line - 1).toString() +
                    '}.{' + this.synonyms.context.start + '})' +
                     this.synonyms.context.wordStr +
                    '([\\s\\S]*)'
                )
              , match = this.textarea.val().match(regex);

            if (match) {
                var replacedText = match[1] + wordStr + ' ';
                this.textarea.val(replacedText + match[2]);
                this.setCaretPosition(replacedText.length);
            } else { this.textarea.focus(); }

            // Update rankings appropriately for the replace operation
            this.synonyms.context.word.handleReplace(wordStr, type)
        },

        getWordInfo: function (caretOffset) {
            caretOffset = caretOffset || 0;

            var lineInfo = this.getLineInfo()
              , line = lineInfo.lineNo
              , text = lineInfo.text
              , start = end = lineInfo.caretPos + caretOffset
              , wordChars = /[a-zA-Z'-]/;

            // Get the start and end boundries of the word
            while (text[start - 1] &&
                   wordChars.test(text[start - 1])) { start--; }

            while (text[end] &&
                   wordChars.test(text[end])) { end++; }

            return start === end ? null : {
                line: line,
                start: start,

                // The coordinates of the word in the editor
                // y coordinate is the width of text before the word
                x: this.getTextWidth(text.slice(0, start)),
                y: (line * this.lineHeight) + 4,

                // The word as a string
                word: text.substring(start, end)
            };
        },

        getLineInfo: function () {
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

        // Gets the editor caret position by line and character
        getCaretPosition: function () {
            var pos = 0
              , input = this.textarea.el;

            // IE Support
            if (document.selection) {
                input.focus();
                var sel = document.selection.createRange();
                var selLen = document.selection.createRange().text.length;
                sel.moveStart('character', -input.value.length);
                pos = sel.text.length - selLen;

            } else if (input.selectionStart || input.selectionStart == '0') {
                pos = input.selectionStart;
            }

            return pos;
        },

        // Sets the editor caret position by line and character
        setCaretPosition: function (index) {
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

        selectAll: function () {
            var textarea = this.textarea;
            textarea.select();

            // Chrome support
            textarea.mouseup(function() {
                // Prevent further mouseup intervention
                textarea.unbind("mouseup");
                return false;
            });
        },

        onCopy: function () {

            this.textarea.focus();

            if (!this.hasSelection()) {
                this.selectAll();
            }

            return true;
        },


/* -- Type Prediction -- */

        predictType: function (context) {
            return context.word.defaultType();
        },


/* -- Utility -- */

        hasSelection: function () {
            var input = this.textarea.el;

            return document.selection ? // IE support
                   document.selection.getRange().text.length > 0 :

                   // All other browsers
                   input.selectionStart !== input.selectionEnd;
        },

        getTextWidth: function (text) {
            return this.$('#line-copy').html(text).width();
        },

        isOSX: function () {
            return /Mac/.test(navigator.userAgent);
        }
    });

    return EditorView;
});
