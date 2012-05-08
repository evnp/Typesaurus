define([
    'jquery',
    'underscore',
    'backbone',
    'jqcolor',

    'text!templates/word/synonyms/types.html'

], function($, _, Backbone, jQueryColor, synTypesTemplate) {

    var TypeView = Backbone.View.extend({

        render: function (synView, synList, word) {

            // Render the list
            synList.append(_.template(synTypesTemplate, {
                types: word.get('types'),
                _: _
            }));

            var container = $('.word-types', synList)
              , items = $('.word-types div', synList)
              , typeListWidth = 54
              , startingType = $('.word-types .' + synView.type, synList)
              , view = this;

            this.synList = synList;

            // Animate list addition
            container.css({
                'width': synList.outerWidth(),
                'overflow': 'hidden'
            });
            container.animate({
                'width': container.outerWidth() + typeListWidth,
                'left': -typeListWidth
            }, 200, function () {

                // Post Animation HTML Operations
                container.css({
                    'overflow': 'visible',
                    'width': typeListWidth
                });

                // Create Tab Connection
                synList.css('border-left-style', 'none');
                container.append( '<div ' // Create false right border
                  + 'id="falseBorder" '
                  + 'style="'
                  + 'width: 1px; '
                  + 'height: ' + synList.outerHeight() + 'px; '
                  + 'position: absolute; '
                  + 'right: 0; '
                  + 'z-index: -2; '
                  + 'padding: 0; '
                  + 'border-style: none; '
                  + 'background-color: #2D768E;"></div>');


                // Select the chosen type
                view.extend(startingType);
                view.select(startingType);
            });

            // Set up hover effect
            items.hover(function (e) {
                var target = $(e.target)

                if (e.type === 'mouseenter') {
                    view.extend(target);

                // Leave the tag out if it's selected
                } else if (e.type === 'mouseleave' && target === this.item) {
                    view.retract(target);
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

                    // Length of the synonym list may change, so resize            
                    $('#falseBorder').css('height', synList.outerHeight() + 'px');
                }

                // Prevent from registering as click on the synonym list
                return false;
            });

            return this;
        },

        select: function (item) {
            if (this.item) {
                // Return the tag to it's default position
                this.retract(this.item);

                // Colorize
                this.item.animate({
                    'color': '#ffffff',
                    'background-color': '#0189b0'
                },{
                    duration: 200,
                    queue: false
                });
                console.log('second');

                this.item.css('z-index', -2);
            }

            // Colorize
            item.animate({
                'color': '#0189b0',
                'background-color': '#f0f7ff'
            },{
                duration: 200,
                queue: false
            });

            item.css('z-index', -1);
            this.item = item;
        },

        extend: function(item) {
            item.animate({
                'margin-right': this.synList.outerWidth(),
                'margin-left': -(item.outerWidth() +
                    Number($('.word-types', this.synList)
                        .css('left').replace(/[^-\d\.]/g, '')))
            },{
                duration: 200,
                queue: false
            });
        },

        retract: function(item) {
            item.animate({
                'margin-left': 0,
                'margin-right': 0
            },{
                duration: 400,
                queue: false
            });
        }
    });

    return TypeView;
});
