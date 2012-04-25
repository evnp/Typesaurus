define([
    'jquery',
    'underscore',
    'backbone',

    'collections/words',
    'text!templates/word/definitions.html'

], function($, _, Backbone, wordCollection, defTemplate) {

    var DefinitionView = Backbone.View.extend({

        el: '#definitions',

        initialize: function(){
            this.words = wordCollection;
            this.words.bind('add', this.addDefinition);
        },

        addDefinition: function(model, value){
            // update list
        },

        render: function(){
            var data = {
                definitions: this.words.models,
                _: _ // Underscore can be passed in so that
            };       // its functions are accessible on the template

            var compiledTemplate = _.template( defTemplate, data );
            this.$el.html( compiledTemplate ); 
        }
    });

    return DefinitionView;
});
