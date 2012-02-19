define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var synonymView = Backbone.View.extend({

        el: $('.synonyms'),

        initialize: function(word){
            if (word) {
                this.word = word; // An instance of 'Word' model
                this.word.bind('change:[synonyms]', this.synonymsChanged);
            }
        },

        synonymsChanged: function(model, value){
            // update list
        },

        render: function(){
            var data = {
                synonyms: this.word.synonyms,
                _: _ // Underscore can be passed in so that
            };       // its functions are accessible on the template

            var compiledTemplate = _.template( synonymsTemplate, data );
            $('.synonyms').html( compiledTemplate ); 
        }
    });

    return new synonymView;
});
