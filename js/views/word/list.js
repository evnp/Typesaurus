define([
    'jQuery',
    'Underscore',
    'Backbone',

    'collections/words',
    'text!templates/word/list.html'

], function($, _, Backbone, wordCollection, wordListTemplate){

    var wordListView = Backbone.View.extend({

        el: $("#page"),

        initialize: function(){
            this.collection = wordCollection;
            this.collection.on("add", this.wordAdded);
        },

        wordAdded: function(model) {
            //console.log(model);
        },

        render: function(){
            var data = {
                words: this.collection.models,
                _: _
            };

            var compiledTemplate = _.template( wordListTemplate, data );
            $("#page").html( compiledTemplate ); 
        }
    });

    return new wordListView;
});
