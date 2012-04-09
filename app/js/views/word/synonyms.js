define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var SynonymView = Backbone.View.extend({

        render: function(x, y, word, level){
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
            this.setUpNavigation(list, x, y, level);

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
                if (view.selectedListId === level) {
                    view.select($('li:nth-child(' + (view.selectedItemRank - 1) + ')', ul),
                                  level,
                                  view.selectedItemRank);
                }
            });

            return list;
        },

        setUpHoverSelect: function (list) {
            var view = this;

            $('li', list).hover(function (e) {
                var item = $(e.target);
                if (e.type === 'mouseenter') {
                    if (view.selectedItem) {
                        view.selectedItem.removeClass('selected');
                    }
                    item.addClass('selected');
                    view.selectedItem = item;
                }
            });
        },

        setUpNavigation: function (list, x, y, level) {
            var view = this;

            $(list).bind('keydown', 'up', function (e) {
                var item = view.selectedItem.prev();
                if (item) { view.select(item); }
            });

            $(list).bind('keydown', 'down', function (e) {
                var item = view.selectedItem.next();
                if (item && item[0]) { view.select(item); }
                else { view.select($('ul li:first-child', e.target), level + 1, 1); }
            });

            function activateSelected() {
                // Clear all lists lower than the one containing the selected item
                view.clear(level + 1);

                var item = view.selectedItem,
                    html = item.html().split(' '),
                    rank = Number(html[0]),
                    word = view.editor.getWordObject(html[1]);
                    nestedList = view.render(x + list.width() + 1,
                                             y + ((rank - 1) * item.height()),
                                             word,
                                             level + 1);

                nestedList.focus();
                view.select($('ul li:first-child', nestedList), level + 1, 1);

                return false; // Prevents bubbling the event up to the document,
                              // which would clear all synonym lists
            }

            $(list).click(activateSelected);
            $(list).bind('keydown', 'right', activateSelected);

            $(list).bind('keydown', 'left', function () {
                var previous = view.clear(level);
                if (previous) { previous.focus(); }
                else { view.editor.textarea.focus(); }
            });

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clear(0); });
        },

        select: function(item, listId, rank) {
            if (this.selectedItem) { this.selectedItem.removeClass('selected'); }
            if (item) { item.addClass('selected'); }

            this.selectedItem = item;
            this.selectedListId = listId;
            this.selectedItemRank = rank;
        },

        clear: function (level) { // Remove all synonym lists at levels >= 'level'
            var lastRemaining;

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
        }
    });

    return new SynonymView;
});
