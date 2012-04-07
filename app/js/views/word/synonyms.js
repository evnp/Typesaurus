define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var synonymView = Backbone.View.extend({

        el: $('#synonyms'),

        initialize: function() {
            this.hidden = true;
        },

        bindNav: function() {
            $('#synonyms li').hover(function (e) {
                var item = $(e.target);
                if (e.type === 'mouseenter') {
                    item.addClass('selected');
                } else {
                    item.removeClass('selected');
                }
            });
        },

        synonymsChanged: function(model, value){
            alert('changing');
            this.render();
        },

        render: function(x, y, word){

            // if new values are given, use them.
            if (x) { this.x = x; }
            if (y) { this.y = y; }
            if (word) {
                if (this.word) { // If an old word was set, remove its bindings
                    this.word.unbind('change:[synonyms]');
                }

                this.word = word;
                this.word.bind('change:[synonyms]', this.synonymsChanged);
            }

            var element = $('#synonyms'),

                data = {
                    synonyms: this.word.getSynonyms(5),
                    _: _ // Underscore can be passed in so that
                };       // its functions are accessible on the template


            var compiledTemplate = _.template( synonymsTemplate, data );
            element.html( compiledTemplate );

            // Position and show the new synonym element
            this.hidden = false;
            element.css({
                'display': 'inline',
                'left': this.x,
                'top' : this.y
            });

            this.bindNav();
        },

        hide: function() {
            $('#synonyms').css('display', 'none');
            this.hidden = true;
        }
    });

    return new synonymView;
});
