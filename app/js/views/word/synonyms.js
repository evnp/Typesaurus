define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var SynonymView = Backbone.View.extend({

        initialize: function () {
            this.sel  = {}; // Keeps track of selected item
            this.path = []; // Keeps track of path through active lists
        },

        render: function(word, level, x, y){
            this.word = word;

            var data = {
                    synonyms: this.word.getSynonyms(5),
                    _: _
                },
                compiledTemplate = _.template(synonymsTemplate,
                    data).replace('level-number', level);

            this.el.append(compiledTemplate);

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
            this.word.bind('change:synonyms', function () {
                var ul = $('ul', list),
                     i = 1;

                ul.empty();

                _.each(view.word.getSynonyms(5), function (synonym) {
                    ul.append('<li>' + i + ' ' + synonym + '</li>');
                    i++;
                });

                // New li's were created; reconfigure events
                view.setUpHoverSelect(list);

                // Maintain the correct item selection through synonym update
                if (view.sel.list && view.sel.list.attr('id') === list.attr('id')) {
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
            var view = this,
                level = Number(list.attr('id'));

            $(list).bind('keydown', 'up', function (e) {
                var item = view.sel.item.prev();
                if (item) { view.select(item, item.index() + 1); }
            });

            $(list).bind('keydown', 'down', function (e) {
                var item = view.sel.item.next();
                if (item && item[0]) { view.select(item, item.index() + 1); }
                else { view.select($('ul li:first-child', e.target), 1, list); }
            });

            function lookUpSelected() {
                view.lookUp(view.sel.item, view.sel.rank, {
                    width: list.width(),
                    level: level,
                    x: x, y: y
                });

                return false; // Prevents bubbling the event up to the document,
                              // which would clear all synonym lists
            }

            $(list).click(lookUpSelected);
            $(list).bind('keydown', 'right', lookUpSelected);

            $(list).bind('keydown', 'left', function () {
                var previous = view.clear(level),
                    prevRank = view.path.pop(),
                    prevItem = $('ul li:nth-child(' + prevRank + ')', previous);

                if (previous) { view.select(prevItem, prevRank, previous); }
                else { view.editor.textarea.focus(); }
            });

            // Bind number keys
            for (var i = 1; i < 6; i++) {
                $(list).bind('keydown', i.toString(), function (e) {
                    var numPressed = e.which - 48;
                    if (numPressed === view.sel.rank) {
                        view.activate(view.sel.item);
                    } else {
                        var item = $('ul li:nth-child(' + numPressed + ')', e.target);
                        view.select(item, numPressed);
                    }
                    return false;
                })
            }

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clear(0); });
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
            this.clear(listData.level + 1); // Clear all lower lists
            this.path.push(rank); // Store the word's rank, so it can be returned to later.

            var list = this.render(this.editor.getWordObject(this.getWordStr(item)),
                                   listData.level + 1,
                                   listData.x + listData.width + 1,
                                   listData.y + ((rank - 1) * item.height()));

            this.select($('ul li:first-child', list), 1, list);
        },

        activate: function (item) {
            this.clear();
            this.editor.replace(this.getWordStr(item));
        },

        clear: function (level) { // Remove all synonym lists at levels >= 'level'
            var lastRemaining,    // Returns lowest remaining list
                level = level || 0;

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

        getWordStr: function (item) {
            return item.html().match(/[a-zA-Z]+.+$/)[0];
        }
    });

    return new SynonymView;
});
