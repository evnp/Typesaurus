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
                    if (target.html() !== view.item.html()) {
                        view.colorize(target, 'hover');
                    }
                    view.extend(target);

                } else if (e.type === 'mouseleave') {

                    // Leave the tag out if it's selected
                    console.log(view.item.html());
                    console.log(target.html());
                    if (target.html() !== view.item.html()) {
                        view.retract(target);
                        view.colorize(target);
                    }
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
                // Return the item to it's default state
                this.retract(this.item);
                this.colorize(this.item);

                this.item.css('z-index', -2);
            }

            this.colorize(item, 'select');

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
        },

        colorize: function(item, state) {
            item.animate({
                color:
                    (state === 'select' ? '#0189b0' :
                                          '#ffffff' ),
                backgroundColor:
                    (state === 'select' ? '#f0f7ff' :
                    (state === 'hover'  ? '#2ea5c7' :
                                          '#0189b0' ))
            },{
                duration: 200,
                queue: false
            });
        }
    });

    return TypeView;
});
