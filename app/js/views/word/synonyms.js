define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var SynonymView = Backbone.View.extend({

        initialize: function () {
            this.sel   = {}; // Keeps track of selected item
            this.lists = []; // Keeps track of active list information
        },

        render: function(word, level, x, y){
            this.lists.push({ // Store new list information
                word: word,
                position: 0
            });

            this.el.append(_.template(synonymsTemplate, {
                level: level,
                synonyms: word.getSynonyms(5),
                classFrom: word.classFrom,
                _: _
            }));

            var list = this.$('#' + level), // Get the new synonym list element
                view = this;

            // Position the list
            list.css({
                'left': x,
                'top' : y
            });

            // Set up navigation on the list
            this.setUpHoverSelect(list);
            this.setUpNavigation(list, x, y);

            // Set up word synonym update event
            word.bind('change:synonyms', function () {
                var ul = $('ul', list),
                    pos = view.lists[level].position;
                    i = 1;

                ul.empty();

                _.each(word.getSynonyms(pos + 5, pos), function (synonym) {
                    ul.append('<li class="' + word.classFrom(synonym) + '">' +
                                  i + ' ' + synonym +
                              '</li>');
                    i++;
                });

                // New li's were created; reconfigure events
                view.setUpHoverSelect(list);

                // Maintain the correct item selection through synonym update
                if (view.sel.list && Number(view.sel.list.attr('id')) === level) {
                    view.select($('li:nth-child(' + (view.sel.rank) + ')', ul),
                                view.sel.rank);
                }
            });

            return list;
        },

        setUpHoverSelect: function (list) {
            var view = this;

            $('li', list).hover(function (e) {
                var item = $(e.target);
                if (e.type === 'mouseenter') {
                    view.select(item, item.index() + 1, list);
                }
            });
        },

        setUpNavigation: function (list, x, y) {

            // Arrow Keys
            $(list).bind('keydown', 'up',    selectPrev);
            $(list).bind('keydown', 'down',  selectNext);
            $(list).bind('keydown', 'right', lookUpSelected);
            $(list).bind('keydown', 'left',  closeList);

            // Number Keys
            for (var i = 1; i < 6; i++) {
                $(list).bind('keydown', i.toString(), onNumPress);
            }

            // Other Keys
            $(list).bind('keydown', 'space',  lookUpSelected);
            $(list).bind('keydown', 'return', insertSelected);

            // Mouse
            $(list).click(lookUpSelected);

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clearLists(); });


            var view = this,
                level = Number(list.attr('id'));

            function selectPrev(e) {
                var item = view.sel.item.prev();
                if (item) { view.select(item, item.index() + 1); }
            }

            function selectNext(e) {
                var item = view.sel.item.next();
                if (item && item[0]) { view.select(item, item.index() + 1); }
                else { view.select($('ul li:first-child', e.target), 1, list); }
            }

            function lookUpSelected() {
                view.lookUp(view.sel.item, view.sel.rank, {
                    width: list.width(),
                    level: level,
                    x: x, y: y
                });
                              // Prevents bubbling the event up to the document,
                return false; // which would clear all synonym lists
            }

            function insertSelected() {
                view.insert(view.sel.item);
                return false;
            }

            function closeList() {
                var word = view.lists[level].word,
                    previous = view.clearLists(level),
                    prevItem = $('ul li.' + word.getAsClass(), previous),
                    prevRank = prevItem.index() + 1;

                if (previous) { view.select(prevItem, prevRank, previous); }
                else { view.editor.textarea.focus(); }
            }

            function onNumPress(e) {
                var numPressed = e.which - 48;
                if (numPressed === view.sel.rank) {
                    insertSelected();
                } else {
                    var item = $('ul li:nth-child(' + numPressed + ')', e.target);
                    view.select(item, numPressed);
                }
                return false;
            }
        },

        select: function (item, rank, list) {
            if (this.sel.item) { this.sel.item.removeClass('selected'); }
            if (item) { item.addClass('selected'); }

            this.sel.item = item;
            this.sel.rank = rank;

            if (list) { this.sel.list = list; }
            this.sel.list.focus();
        },

        lookUp: function(item, rank, listData) {
            var word = this.editor.getWordObject(this.getWordStr(item));

            this.clearLists(listData.level + 1); // Clear all lower lists

            var list = this.render(word,
                                   listData.level + 1,
                                   listData.x + listData.width + 1,
                                   listData.y + ((rank - 1) * item.height()));

            this.select($('ul li:first-child', list), 1, list);
        },

        insert: function (item) {
            this.clearLists();
            this.editor.insert(this.getWordStr(item));
        },

        moveDown: function (list, level) {
            this.lists[level].position++;
            var ul = $('ul', list),
                next = null; // Should now be able to used cached list info
                             // to get more synonyms.
        },

        moveUp: function (list, level) {
        },

        clearLists: function (level) { // Remove all synonym lists at levels >= 'level'
            var lastRemaining,         // Returns lowest remaining list
                level = level || 0;

            // When clearing all lists, also clear the selection
            if (level === 0) { this.clearSelection(); }

            // Reduce lists info cache down to remaining lists only
            this.lists = this.lists.slice(0, level);

            _.each($('.synonyms'), function (list) {
                var $list = $(list),
                    id = Number($list.attr('id'));

                if (id >= level) {
                    $list.remove();
                } else if (id === (level - 1)) {
                    lastRemaining = $list;
                }
            });

            return lastRemaining;
        },

        clearSelection: function () {
            this.sel   = {};
        },

        getWordStr: function (item) {
            return item.html().match(/[a-zA-Z]+.+/)[0];
        }
    });

    return new SynonymView;
});
