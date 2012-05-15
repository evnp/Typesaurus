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

            this.charWidth  = 12;
            this.lineHeight = 24;
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
            this.bindAutoResize();

            // Bind synonym-menu hotkey and other events
            this.bindHotkeys();

            return this;
        },

        createSynonymView: function () {
            this.synonyms = new SynonymView;
            this.synonyms.editor = this;
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

            this.switchMode(); // Initially defaults to hotkey mode

            // Transfer control from texarea to synonym list
            this.textarea.keydown('down', selectFirst);
            this.textarea.keydown('tab',  selectFirst);

            function selectFirst() {
                var list = $('#0', editor.synonyms.el);

                if (list && list[0]) {
                    editor.synonyms.select($('ol li:first-child', list), 1, list);
                    return false;
                } else { return true; }
            }

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
        },

        switchMode: function () {
            var editor = this;

            this.mode = this.mode === 'hotkey' ? 'auto' : 'hotkey';
            this.hotkey = this.hotkey || 'ctrl+shift+space';

            if (this.mode === 'hotkey') {
                this.textarea.keydown('space', function () { editor.synonyms.clear(); });
                this.textarea.keydown(this.hotkey, function () {
                    editor.summonList(editor.getWordInfo());
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
                  , word = editor.words.getFrom(wordInfo.word)
                  ,    x = wordInfo.start * this.charWidth
                  ,    y = wordInfo.line * this.lineHeight;

                // Get the synonym view ready for a new list tree
                editor.synonyms.clear();
                editor.synonyms.context = wordInfo;
                editor.synonyms.context.wordStr = editor.synonyms.context.word;
                editor.synonyms.context.word = word;

                editor.synonyms.render(word, 0, x, y);
            }
        },

        insert: function (wordStr) {
            var regex = new RegExp('((?:.*[\n]){' +
                                    (this.synonyms.context.line - 1).toString() +
                                   '}.{' + this.synonyms.context.start + '})' +
                                    this.synonyms.context.wordStr +
                                   '([\\s\\S]*)'),
                match = this.textarea.val().match(regex);

            if (match) {
                var replacedText = match[1] + wordStr;
                this.textarea.val(replacedText + match[2]);
                this.setCaretPosition(replacedText.length);
            } else { this.textarea.focus(); }
        },

        getWordInfo: function (caretOffset) {
            caretOffset = caretOffset || 0;

            var lineInfo = this.getLineInfo(),
                text = lineInfo.text,
                start = end = lineInfo.caretPos + caretOffset,
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

        predictType: function (context) {
            return context.word.defaultType();
        }
    });

    return EditorView;
});
