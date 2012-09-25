define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',
    'jqlongkeys',
    'areagami',

    'collections/words',
    'views/word/synonyms',
    'text!templates/editor.html'

], function ($, _, Backbone, jqHotkeys, jqLongkeys, areagami,

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
              , insertSpace  = function () {
                    editor.synonyms.clear();
                    editor.textarea.gami('insert', ' ');
                }
              , autoSummonList = function () {
                    editor.summonList(editor.getWordInfo(-1));
                }
              ;

            if (this.mode === 'hotkey') {
                this.textarea.off('keyup.space.summon');
                this.textarea.on('longkeydown.space.summon', {
                    onDown:  prefetchWord,
                    onShort: insertSpace
                },  summonList);

            } else if (this.mode === 'auto') {
                this.textarea.off('longkeydown.space.summon');
                this.textarea.on('keyup.space.summon', autoSummonList);
            }
        },

        summonList: function (wordInfo) {
            if (wordInfo) { // Get the synonym view ready for a new list tree
                this.synonyms.clear();
                this.synonyms.context = wordInfo;
                this.synonyms.render(wordInfo.obj, 0, wordInfo.pos);
            }
        },

        insert: function (word, type) {
            this.textarea.gami('replaceWord', word);
            this.synonyms.context.obj.handleReplace(word, type);
            // Update rankings appropriately for the replace operation
        },

        getWordInfo: function (offset) {
            offset = offset || 0;

            var area = this.textarea
              , word = area.gami('word', offset);

            return {
                line:  area.gami('lineNo',        offset),
                start: area.gami('lineWordStart', offset),
                pos:   area.gami('wordXY',        offset),
                obj:   this.words.getFrom(word),
                str:   word
            };
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
            return context.obj.defaultType();
        },


/* -- Utility -- */

        hasSelection: function () {
            var input = this.textarea.el;

            return document.selection ? // IE support
                   document.selection.getRange().text.length > 0 :

                   // All other browsers
                   input.selectionStart !== input.selectionEnd;
        },

        isOSX: function () {
            return /Mac/.test(navigator.userAgent);
        }
    });

    return EditorView;
});
