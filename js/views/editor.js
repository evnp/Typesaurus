define([
    'jquery',
    'underscore',
    'backbone',

    'collections/words',
    'text!templates/editor.html'

], function($, _, Backbone, wordCollection, editorTemplate) {

    var synonymView = Backbone.View.extend({

        el: $("#editor"),

        initialize: function(word){
            this.collection = wordCollection;
        },

        render: function(){
            var data = {
                instructions:
                    'Type here to use the typesaurus. ' +
                    'After you type a word, press\nctrl + shift + space\n' +
                    'to show its synonyms.',
                _: _
            };

            var compiledTemplate = _.template( editorTemplate, data );
            $("#editor").html( compiledTemplate ); 
        }
    });

    return new synonymView;
});
