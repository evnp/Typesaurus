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
            this.collection.bind("add", this.exampleBind);
            this.collection = wordCollection.add({ is: "liquify"});
        },

        exampleBind: function( model ){
            //console.log(model);
        },

        render: function(){
            var data = {
                projects: this.collection.models,
                _: _
            };

            var compiledTemplate = _.template( wordListTemplate, data );
            $("#page").html( compiledTemplate ); 
        }
    });

    return new wordListView;
});
