define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var SynonymView = Backbone.View.extend({

        render: function(x, y, word, level){

            this.word = word;
            this.word.bind('change:synonyms', this.synonymsChanged);

            var data = {
                    synonyms: this.word.getSynonyms(5),
                    _: _
                },
                compiledTemplate = _.template(synonymsTemplate,
                    data).replace('level-number', level);

            this.el.html(this.el.html() + compiledTemplate);

            // Get the new synonym list element
            var list = this.$('#' + level);

            // Position the list
            list.css({
                'left': x,
                'top' : y
            });

            // Set up navigation on the list
            if (level === 0) {this.bindNav(list, x, y, level);}

            return this;
        },

        bindNav: function(list, x, y, level) {
            var synonymView = this;

            $('li', list).hover(function (e) {
                var item = $(e.target);
                if (e.type === 'mouseenter') {
                    item.addClass('selected');
                } else {
                    item.removeClass('selected');
                }
            });

            $('li', list).click(function (e) {
                var item = $(e.target),
                    html = item.html().split(' '),
                    rank = Number(html[0]),
                    word = synonymView.editor.getWordObject(html[1]);

                synonymView.render(x + list.width() + 1,
                                   y + (rank * item.height()),
                                   word,
                                   level + 1);
            });
        },

        synonymsChanged: function(model, value){
            //this.render();
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
