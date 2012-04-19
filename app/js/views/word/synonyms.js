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
            $('li', list).hover(function (e) { view.onMouseHover(e, list); });
            this.setUpNavigation(list, x, y);

            // Set up word synonym update event
            word.bind('change:synonyms', function () {
                var ol = $('ol', list),
                    pos = view.lists[level].position;

                ol.empty();

                _.each(word.getSynonyms(pos + 5, pos), function (synonym) {
                    ol.append('<li class="' + word.classFrom(synonym) + '">' + synonym + '</li>');
                });

                // New li's were created; reconfigure li events
                $('li', list).hover(function (e) { view.onMouseHover(e, list); });

                // Maintain the correct item selection through synonym update
                if (view.sel.list && Number(view.sel.list.attr('id')) === level) {
                    view.select($('li:nth-child(' + (view.sel.rank) + ')', ol),
                                view.sel.rank);
                }
            });

            return list;
        },

        onMouseHover: function (e, list) {
            var item = $(e.target);
            if (e.type === 'mouseenter') {
                this.select(item, item.index() + 1, list);
            }
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
            $(list).bind('keydown', 'tab',    lookUpSelected);
            $(list).bind('keydown', 'shift+tab', closeList);

            // Mouse
            $(list).click(lookUpSelected);

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clearLists(); });


            var view = this,
                level = Number(list.attr('id'));

            function selectPrev(e) {
                var item = view.sel.item.prev();

                if (item && item[0]) {
                    view.select(item, item.index() + 1);
                } else if (view.lists[level].position) {
                    view.moveList('up', list, level);
                    view.select($('ol li:first-child', list), 1, list);
                }
                return false;
            }

            function selectNext(e) {
                var item = view.sel.item.next(),
                    listData = view.lists[level];

                if (item && item[0]) {
                    view.select(item, item.index() + 1);
                } else if (listData.position + 5 < listData.word.get('synonyms').length) {
                    view.moveList('down', list, level);
                    var newItem = $('ol li:last-child', list);
                    view.select(newItem, newItem.index() + 1);
                }
                return false;
            }

            function lookUpSelected() {
                view.lookUp(view.sel.item, view.sel.rank, {
                    width: list.width(),
                    level: level,
                    x: x, y: y
                });
                return false;
            }

            function insertSelected() {
                view.insert(view.sel.item);
                return false;
            }

            function closeList() {
                var word = view.lists[level].word,
                    previous = view.clearLists(level),
                    prevItem = $('ol li.' + word.getAsClass(), previous),
                    prevRank = prevItem.index() + 1;

                if (previous) { view.select(prevItem, prevRank, previous); }
                else { view.editor.textarea.focus(); }
                return false;
            }

            function onNumPress(e) {
                var numPressed = e.which - 48;
                if (numPressed === view.sel.rank) {
                    insertSelected();
                } else {
                    var item = $('ol li:nth-child(' + numPressed + ')', e.target);
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

            this.select($('ol li:first-child', list), 1, list);
        },

        insert: function (item) {
            this.clearLists();
            this.editor.insert(this.getWordStr(item));
        },

        moveList: function (direction, list, level) {
            var movingDown = direction === 'down';

            this.lists[level].position += movingDown ? 1 : -1;

            var ol = $('ol', list),
                listData = this.lists[level];
                newSyn = listData.word.getSynonym((movingDown ? 5 : 1) + listData.position - 1),
                li = '<li class="' + newSyn + '">' + newSyn + '</li>';

            // Add the item that's shown by the move
            ol[ movingDown ? 'append' : 'prepend' ](li);

            // Remove the item that's hidden by the move
            $('li:nth-child(' + (movingDown ? 1 : 6) + ')', ol).remove();

            // Configure mouse hover on the new item
            var view = this;
            $('li:' + (movingDown ? 'last' : 'first') + '-child', ol).hover(function (e) {
                view.onMouseHover(e, list);
            });
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
            return item.html();
        }
    });

    return new SynonymView;
});
