define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',
    'jqlongkeys',

    'collections/words',
    'views/word/synonyms',
    'text!templates/editor.html'

], function ($, _, Backbone, jqHotkeys, jqLongkeys,

WordCollection,
SynonymView,
editorTemplate) {

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

            // Set up modes - defaults to hotkey
            this.switchMode();

            // Transfer control from texarea to synonym list
            this.textarea.on('keydown.down', selectFirst);
            this.textarea.on('keydown.tab',  selectFirst);

            // Transfer control from texarea to synonym list on number key press
            for (var i = 1; i < 6; i++) {
                this.textarea.on('keydown.' + i.toString(), function (e) {
                    var list = $('#0', editor.synonyms.el);

                    if (list && list[0]) {
                        var numPressed = e.which - 48,
                            item = $('ol li:nth-child(' + numPressed + ')', list);

                        editor.synonyms.select(item, numPressed, list);
                        return false;
                    } else { return true; }
                });
            }

            this.textarea.on('keydown.space',     function () { editor.synonyms.clear; });
            this.textarea.on('keydown.return',    function () { editor.synonyms.clear; });
            this.textarea.on('keydown.backspace', function () { editor.synonyms.clear; });

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

            this.textarea.on('keydown.' + modifier + '+c', onCopy);
            $(document).on(  'keydown.' + modifier + '+c', onCopy);
            $(document).on(  'keydown.' + modifier + '+v', onPaste);
        },

        switchMode: function () {

            this.mode = this.mode === 'hotkey' ? 'auto' : 'hotkey';

            var editor = this
              , wordInfo
              , prefetchWord = function () { wordInfo = editor.getWordInfo(); }
              , summonList   = function () { editor.summonList(wordInfo);     }
              , insertSpace  = function () { editor.insertAfterCaret(' ');    }
              , autoSummonList = function () {
                    editor.summonList(editor.getWordInfo(-1));
                }
              ;

            if (this.mode === 'hotkey') {
                this.textarea.off('keyup.space.summon');
                this.textarea.on('longkeydown.space', {
                    onDown:  prefetchWord,
                    onShort: insertSpace
                },  summonList);

            } else if (this.mode === 'auto') {
                this.textarea.off('longkeydown.space');
                this.textarea.on('keyup.space.summon', autoSummonList);
            }
        },

        summonList: function (wordInfo) {

            // Get the synonym view ready for a new list tree
            if (wordInfo) {
                this.synonyms.clear();
                this.synonyms.context = wordInfo;
                this.synonyms.render(wordInfo.wordObj, 0, wordInfo.x, wordInfo.y);
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
            this.synonyms.context.wordObj.handleReplace(wordStr, type)
        },

        insertAfterCaret: function (str) {
            var textInfo = this.getTextInfo()
              , text = textInfo.text
              , pos  = textInfo.pos;

            this.textarea.val(text.substring(0, pos) + str + text.substring(pos));
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

            var word = text.substring(start, end);

            return start === end ? null : {
                line: line,
                start: start,

                // The coordinates of the word in the editor
                // y coordinate is the width of text before the word
                x: this.getTextWidth(text.slice(0, start)),
                y: (line * this.lineHeight) + 4,

                // The word as a string
                wordStr: word,

                // The word object itself
                wordObj: this.words.getFrom(word)
            };
        },

        getLineInfo: function () {
            var textInfo = this.getTextInfo()
              , text     = textInfo.text
              , position = textInfo.pos
              , before   = text.substring(0, position);

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

        getTextInfo: function () {
            return {
                text: this.textarea.val(),
                pos:  this.getCaretPosition()
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
            if (!this.hasSelection()) { this.selectAll(); }

            return true;
        },


/* -- Type Prediction -- */

        predictType: function (context) {
            return context.wordObj.defaultType();
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
