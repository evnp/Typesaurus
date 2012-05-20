define([
    'jquery',
    'underscore',
    'backbone',

    'views/word/types',
    'text!templates/word/synonyms/container.html',
    'text!templates/word/synonyms/list.html'

], function($, _, Backbone, TypeView, synContainerTemplate, synListTemplate) {

    var SynonymView = Backbone.View.extend({

        el: '#synonyms-container',

        initialize: function () {
            this.sel   = {}; // Keeps track of selected item
            this.lists = []; // Keeps track of active list information
            this.words = []; // A set of all currently displayed words

            this.type = null;
            // Stores the type of the word tree
            // currently being examined (i.e. noun, verb).

            this.context = null;
            // Stores the context information on the
            // source word for the current tree of lists.
        },

        render: function(word, level, x, y){
            var view = this;

            // Create list information cache
            this.lists.push({
                word: word,
                position: 0,
                synonyms: []
            });

            // Append the list container onto the contents of #synonym-container
            this.$el.append(_.template(synContainerTemplate, {
                _: _, level: level
            }));

            // Get the new synonym list element
            var list = this.$('#' + level);

            // Position the list
            list.css({
                'left': x,
                'top' : y
            });

            // Set up navigation on the list
            this.setUpNavigation(list, x, y);

            // Populate the list:
            // If the word already has types, it is ready to be loaded from.
            if (word.get('types')) {
                setupList();

            } else { // Otherwise, wait until the word data is loaded
                word.bind('change:types', function () { setupList(); });
            }

            function setupList () {

                // Use type prediction to get the most likely word type
                // and cooresponding synonyms.
                view.type = view.type || view.editor.predictType(view.context);
                view.populate(list, word, level);

                // If this is the root list, create the word types list
                if (level === 0) {
                    view.typeList = (new TypeView).render(view, list, word);
                }

                // If this is not the root list, select the first synonym
                else { view.selectFirst(list); }
            }

            return list;
        },


    /* * Navigation * */

        setUpNavigation: function (list, x, y) {

            // Arrow Keys
            $(list).keydown('up',    selectPrev);
            $(list).keydown('down',  selectNext);
            $(list).keydown('right', lookUpSelected);
            $(list).keydown('left',  onLeftArrow);

            // Number Keys
            for (var i = 1; i < 6; i++) {
                $(list).keydown(i.toString(), onNumPress);
            }

            // Other Keys
            $(list).keydown('space',  returnToTextarea);
            $(list).keydown('return', insertSelected);
            $(list).keydown('tab',    lookUpSelected);
            $(list).keydown('shift+tab', closeList);

            // Mouse
            $(list).click(lookUpSelected);

            // Clear all lists on any outside-list click
            $(document).click(function () { view.clear(); });


            var view = this
              , level = Number(list.attr('id'));

            function selectPrev(e) {
                var oldItem = view.sel.item;

                if (oldItem) {
                    var item = oldItem.prev();

                    if (item && item[0]) {
                        view.select(item, item.index() + 1);
                    } else if (view.lists[level].position) {
                        view.move(list, level, 'up');
                        view.selectFirst(list);

                    // If this is the root list, go back to textarea.
                    } else if (level === 0) { returnToTextarea(); }

                } else { view.selectLast(list); }

                return false;
            }

            function selectNext(e) {
                var oldItem = view.sel.item;

                if (oldItem) {
                    var item = oldItem.next()
                      , listData = view.lists[level];

                    if (item && item[0]) {
                        view.select(item, item.index() + 1);
                    } else if (listData.position + 5 < listData.synonyms.length) {
                        view.move(list, level, 'down');
                        view.selectLast(list);
                    }

                } else { view.selectFirst(list); }

                return false;
            }

            function lookUpSelected() {
                var item = view.sel.item;

                if (!item.hasClass('loading')) {
                    view.lookUp(item, view.sel.rank, {
                        width: list.width(),
                        level: level,
                        x: x, y: y
                    });
                }
                return false;
            }

            function insertSelected() {
                view.insert(view.sel.item);
                return false;
            }

            function onLeftArrow() {
                if (level > 0) { closeList(); }
                else {
                    view.deselect();
                    view.typeList.prepareForKeyNav();
                }
            }

            function closeList() {
                if (level === 0) { returnToTextarea(); }
                else {
                    var word = view.lists[level].word
                      , previous = view.clear(level)
                      , prevItem = $('ol li.' + word.toClass(), previous);

                    if (prevItem && prevItem[0]) {
                        view.select(prevItem, prevItem.index() + 1, previous);
                    } else {
                        view.selectFirst(previous);
                    }
                }

                return false;
            }

            function returnToTextarea() {
                view.clear();
                view.editor.textarea.focus();
                return true;
            }

            function onNumPress(e) {
                var numPressed = e.which - 48;

                if (numPressed === view.sel.rank) { insertSelected(); }
                else {
                    var el = $(e.target)
                      , list = el.hasClass('synonyms') ? el : el.parent()
                      , item = $('ol li:nth-child(' + numPressed + ')', list);

                    view.select(item, numPressed);
                }

                return false;
            }
        },

        onMouseHover: function (e, list) {
            var item = $(e.target);

            if (e.type === 'mouseenter') {
                this.select(item, item.index() + 1, list);
            } else {
                this.deselect();
            }
        },


    /* * Synonym Actions * */

        select: function (item, rank, list) {
            this.deselect();

            if (item) { item.addClass('selected'); }
            this.sel.item = item;
            this.sel.rank = rank;

            if (list) { this.sel.list = list; }
            this.sel.list.focus();
        },

        deselect: function () {
            if (this.sel.item) {
                this.sel.item.removeClass('selected');
            }
            this.sel.item = null;
            this.sel.rank = null;
        },

        selectFirst: function (list) {
            this.select($('ol li:first-child', list), 1, list);
        },

        selectLast: function (list) {
            var last = $('ol li:last-child', list);
            this.select(last, last.index() + 1, list);
        },

        lookUp: function(item, rank, listData) {
            this.clear(listData.level + 1); // Clear all lower lists

            var list = this.render(this.editor.words.getFrom(this.getWordStr(item)),
                                   listData.level + 1,
                                   listData.x + listData.width + 1,
                                   listData.y + ((rank - 1) * item.height()));

            this.selectFirst(list);
        },

        insert: function (item) {
            this.clear();
            this.editor.insert(this.getWordStr(item));
        },


    /* * List Actions * */

        populate: function(list, word, level) {
            var view = this
              , type = word.normalizeType(this.type)
              , synonyms = word.getSynonyms(type, 'syn')
              , displayed = this.getDisplayedWords()
              , repeats = [];

            // Find all synonyms that are already being displayed,
            // and move them to the end of the list.
            synonyms = _.filter(synonyms, function (syn) {
                if (displayed.indexOf(syn) === -1) { return true; }
                else { repeats.unshift(syn); return false; }
            }).concat(repeats);

            // Store the full synonym list for
            // use by list movement functions.
            if (this.lists[level]) {
                this.lists[level].synonyms = synonyms;
            }

            // Populate the list
            $('ol', list).html(_.template(synListTemplate, {
                synonyms: synonyms.slice(0, 5), // Get 1st 5 synonyms
                classFrom: word.classFrom,
                _: _
            }));

            // Set up mouse hover on the new li's
            $('li', list).hover(function (e) {
                view.onMouseHover(e, list);
            });
        },

        move: function (list, level, direction) {
            var movingDown = direction === 'down';

            this.lists[level].position += movingDown ? 1 : -1;

            var ol = $('ol', list)
              , listData = this.lists[level]
              , index    = (movingDown ? 5 : 1) + listData.position - 1
              , synonym  = listData.synonyms[index]
              , li       = '<li class="' + synonym + '">' + synonym + '</li>';

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

        clear: function (level) { // Remove all synonym lists at levels >= 'level'
            var lastRemaining,         // Returns lowest remaining list
                level = level || 0;

            // When clearing all lists, reset the view
            if (level === 0) { this.reset(); }

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


    /* * Cleanup * */

        // Clear the selection and type
        reset: function () {
            this.sel   = {};
            this.lists = [];
            this.type = null;
        },


    /* * Utility * */

        // Get the word string out of an li
        getWordStr: function (item) {
            return item.html();
        },

        // Get all synonyms currently being displayed by the list tree
        getDisplayedWords: function () {
            var words = []
              , view  = this
              , lists = this.lists.slice(); // use a copy of lists

            lists.pop(); // Don't include the list that's about to be displayed

            _.each(lists, function (list) {
                words = _.union(words, list.word.getSynonyms(
                    view.type, 'syn', list.position + 5, list.position
                ));
            });

            // Add the source word
            words.push(this.context.wordStr);
            return words;
        }
    });

    return SynonymView;
});
