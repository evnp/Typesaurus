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
                typeContent: word.getPluralizedTypes(),
                typeClasses: word.get('types'),
                _: _
            }));

            var container = $('.word-types', synList)
              , items = $('.word-types div', synList)
              , typeListWidth = 40
              , startingType = $('.word-types .' + synView.type, synList)
              , view = this;

            this.synList = synList;
            this.setElement(container);

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
                synList.css({
                    'border-left-style': 'none',
                    'left': '+=1px',

                    // Make sure synList is never shorter than typeList
                    'min-height': (container.outerHeight() - 1) + 'px'
                });
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
                  + 'background-color: black;"></div>');

                // Select the chosen type
                view.extend(startingType);
                view.select(startingType);
            });

            // Set up hover effect
            items.hover(function (e) {
                var target = $(e.target);

                // eliminate 'hint' arrows from hover
                if (target.hasClass('hint')) { return; }

                if (e.type === 'mouseenter') {
                    if (target.html() !== view.item.html()) {
                        view.colorize(target, 'hover');
                    }
                    view.extend(target);

                } else if (e.type === 'mouseleave') {

                    // Leave the tag out if it's selected
                    if (target.html() !== view.item.html()) {
                        view.retract(target);
                        view.colorize(target);
                    }
                }
            });

            // Set up type switching
            function switchToType(typeItem) {
                var typeStr = typeItem.attr('class');

                if (typeItem && typeItem.is('div')
                 && typeItem.attr('id') !== 'falseBorder'
                 && typeStr !== synView.type) {

                    // Select the new type item
                    view.select(typeItem);

                    synView.type = typeStr;
                    synView.clear(1); // Clear all but the first synonym list

                    synView.populate(synList, word, 0);

                    // Length of the synonym list may change, so resize
                    $('#falseBorder').css('height', synList.outerHeight() + 'px');
                }

                return false;
            }

            $('.word-types div', synList).click(function (e) {
                return switchToType($(e.target, synList));
            });

            this.$el.on('keydown.down', function () {
                var item = view.item.next();

                switchToType(item);
                return false;
            });

            this.$el.on('keydown.up', function () {
                var item = view.item.prev();

                switchToType(item);
                return false;
            });

            this.$el.on('keydown.right', function () {
                synView.select($('ol li:first-child', synList), 1, synList);
                return false;
            });

            this.$el.on('keydown.left', function () { return false; });

            this.$el.blur(function () {
                view.extend(view.item);
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

            this.extend(item);
            this.colorize(item, 'select');

            item.css('z-index', -1);
            this.item = item;
        },

        extend: function(item, offset, hint, callback) {

            if (hint) {
                this.addHintTo(item);
            } else if (this.hasHint(item)) {
                this.removeHintFrom(item);
            }

            var itemWidth = this.getBaseTabWidthOf(item)
              , synListWidth = this.synList.outerWidth();

            item.animate({
                'padding-right': 6 + (offset || 0),
                'margin-right': synListWidth + (offset || 0),
                'margin-left': 1 -(itemWidth + (offset || 0) +
                    Number($('.word-types', this.synList)
                        .css('left').replace(/[^-\d\.]/g, '')))
            },{
                duration: 200,
                queue: false,
                complete: callback
            });
        },

        extendAll: function (extra) {
            var view = this;

            _.each($('.word-types div', this.synList), function extend(item) {
                item = $(item, this.synList);

                if (item.attr('id') !== 'falseBorder') {
                    view.extend(item, extra);
                }
            });
        },

        retract: function (item, callback) {
            var view = this;

            item.animate({
                'margin-left': 0,
                'margin-right': 0,
                'padding-right': 6
            },{
                duration: 200,
                queue: false,
                complete: function () {
                    if (view.hasHint(item)) { view.removeHintFrom(item); }
                    if (callback) { callback(); }
                }
            });
        },

        colorize: function(item, state) {

            var schemeName = 'white'

              , scheme = schemeName === 'blue' ? {
                color:
                    (state === 'select' ? '#0189b0' :
                                          '#ffffff' ),
                backgroundColor:
                    (state === 'select' ? '#ffffff' :
                    (state === 'hover'  ? '#2ea5c7' :
                                          '#0189b0' ))
            } : {
                color:
                    (state === 'select' ? '#015b95' :
                    (state === 'hover'  ? 'white' :
                                          'black' )),
                backgroundColor:
                    (state === 'select' ? 'white' :
                    (state === 'hover'  ? 'black' :
                                          '#eff1f2' ))
            };

            item.animate(scheme, {
                duration: 200,
                queue: false
            });
        },

        prepareForKeyNav: function () {
            // Boolean adds arrow key 'hint'
            this.extend(this.item, -7, true);
            this.$el.focus();
        },

        addHintTo: function (item) {
            // vertical-align: middle on span prevents arrow from
            // moving text down in Firefox/Safari
            return item.append('<span class="hint dark"' +
                               'style="display:inline;' +
                               'vertical-align:top">&nbsp;↕&nbsp;</span>');
        },

        removeHintFrom: function (item) {
            $('.hint', item).remove();

            // Prevents gap from appearing when hint is removed
            item.css('padding-right', 30);
        },

        hasHint: function (item) {
            return Boolean(item.html().indexOf('↕') >= 0);
        },

        getBaseTabWidthOf: function (item) {
            var padding = item.css('padding-right');
            item.css('padding-right', 6);
            var width = item.outerWidth();
            item.css('padding-right', padding);
            return width;
        }
    });

    return TypeView;
});
