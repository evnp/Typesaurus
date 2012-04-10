define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var SynonymView = Backbone.View.extend({

        initialize: function () {
            this.sel  = {}; // Keeps track of selected item
        },

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
                if (view.sel.list.attr('id') === list.attr('id')) {
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

            function activateSelected() {
                // Clear all lists lower than the one containing the selected item
                view.clear(level + 1);

                var item = view.sel.item,
                    word = view.editor.getWordObject(item.html().match(/[a-zA-Z]+.+$/)[0]);
                    nestedList = view.render(x + list.width() + 1,
                                             y + ((view.sel.rank - 1) * item.height()),
                                             word, level + 1);

                view.select($('ul li:first-child', nestedList), 1, nestedList);

                return false; // Prevents bubbling the event up to the document,
                              // which would clear all synonym lists
            }

            $(list).click(activateSelected);
            $(list).bind('keydown', 'right', activateSelected);

            $(list).bind('keydown', 'left', function () {
                var previous = view.clear(level);
                if (previous) { view.select($('ul li:first-child', previous), 1, previous); }
                else { view.editor.textarea.focus(); }
            });

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clear(0); });
        },

        select: function(item, rank, list) {
            if (this.sel.item) { this.sel.item.removeClass('selected'); }
            if (item) { item.addClass('selected'); }

            this.sel.item = item;
            this.sel.rank = rank;

            console.log(this.sel.list);
            if (list) { this.sel.list = list; }
            this.sel.list.focus();
        },

        clear: function (level) { // Remove all synonym lists at levels >= 'level'
            var lastRemaining;    // Returns lowest remaining list

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
