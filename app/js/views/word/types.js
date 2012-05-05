define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms/types.html'

], function($, _, Backbone, synTypesTemplate) {

    var TypeView = Backbone.View.extend({

        render: function (synView, synList, word) {

            // Render the list
            synList.append(_.template(synTypesTemplate, {
                types: word.get('types'),
                _: _
            }));

            var container = $('.word-types', synList)
              , items = $('.word-types div', synList)
              , view = this;

            // Animate list addition
            container.css({
                'width': synList.outerWidth(),
                'overflow': 'hidden'
            });
            container.animate({
                'width': container.outerWidth() + 54,
                'left': -54
            }, 200, function () {
                container.css({
                    'overflow': 'visible'
                });
            });

            // Select the chosen type
            this.select($('.word-types .' + synView.type, synList));

            // Set up hover effect
            items.hover(function (e) {
                var target = $(e.target)
                  , offset = Number($('.word-types', synList)
                                   .css('left')
                                   .replace(/[^-\d\.]/g, ''));

                if (e.type === 'mouseenter') {
                    target.animate({
                        'margin-left': -(target.outerWidth() + offset),
                        'margin-right': synList.outerWidth()
                    }, 200);
                } else if (e.type === 'mouseleave') {
                    target.animate({
                        'margin-left': 0,
                        'margin-right': 0
                    }, 400);
                }
            });

            // Set up type switching
            $('.word-types div', synList).click(function (e) {
                var newType = $(e.target).html();

                if (newType !== synView.type
                &&  word.get('types').indexOf(newType) >= 0) {

                    // Select the new type item
                    view.select($('.word-types .' + newType, synList));

                    synView.type = newType;
                    synView.clear(1); // Clear all but the first synonym list

                    synView.populate(synList, word, 0);
                }

                // Prevent from registering as click on the synonym list
                return false;
            });

            return this;
        },

        select: function (item) {
            if (this.item) {
                this.item.removeClass('selected');
                this.item.css('z-index', -2);
            }
            item.addClass('selected');
            item.css('z-index', -1);
            this.item = item;
        }
    });

    return TypeView;
});
