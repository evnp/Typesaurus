define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/word/synonyms.html'

], function($, _, Backbone, synonymsTemplate) {

    var synonymView = Backbone.View.extend({

        el: $(".synonyms"),

        initialize: function(word){
            this.word = word; // An instance of 'Word' model
            this.word.on("change:[synonyms]", this.synonymsChanged);
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
            $("#page").html( compiledTemplate ); 
        }
    });

    return new synonymView;
});
