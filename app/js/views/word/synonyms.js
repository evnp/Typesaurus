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
            this.bindNav(list, x, y, level);

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
                view.bindNav(list, x, y, level);
            });

            return this;
        },

        bindNav: function(list, x, y, level) {
            var view = this;

            $('li', list).hover(function (e) {
                var item = $(e.target);
                if (e.type === 'mouseenter') {
                    item.addClass('selected');
                } else {
                    item.removeClass('selected');
                }
            });

            $('li', list).click(function (e) {
                // Clear all lists lower than the one that was clicked
                view.clear(level + 1);

                var item = $(e.target),
                    html = item.html().split(' '),
                    rank = Number(html[0]),
                    word = view.editor.getWordObject(html[1]);

                view.render(x + list.width() + 1,
                                   y + ((rank - 1) * item.height()),
                                   word,
                                   level + 1);

                return false; // Prevents bubbling the event up to the document,
                              // which would clear all synonym lists
            });

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clear(0); });
        },

        clear: function (level) { // Remove all synonym lists at levels >= 'level'
            _.each($('.synonyms'), function (list) {
                var $list = $(list);
                if (Number($list.attr('id')) >= level) {
                    $list.remove();
                }
            });
        }
    });

    return new SynonymView;
});
