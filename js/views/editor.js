define([
    'jQuery',
    'Underscore',
    'Backbone',

    'collections/words',
    'text!templates/editor.html'

], function($, _, Backbone, wordCollection, editorTemplate) {

    var synonymView = Backbone.View.extend({

        el: $("#editor"),

        initialize: function(word){
            this.collection = wordCollection;
        },

        render: function(){
            var compiledTemplate = _.template( editorTemplate, {} );
            $("#editor").html( compiledTemplate ); 
        }
    });

    return new synonymView;
});
