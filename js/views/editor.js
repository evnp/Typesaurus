define([
    'jquery',
    'underscore',
    'backbone',

    'collections/words',
    'text!templates/editor.html'

], function($, _, Backbone, wordCollection, editorTemplate) {

    var synonymView = Backbone.View.extend({

        el: $('#editor'),

        initialize: function(word){
            this.collection = wordCollection;
        },

        render: function(){

            // Sets up events to auto-resize the text editor whenever it is changed
            var autoResizeFunction = function() {
                $(function() {
                    $("#text-area").change(autoSize).keydown(autoSize).keyup(autoSize);
                    autoSize();
                });

                function autoSize() {
                    // Copy textarea contents; browser will calculate correct height of copy,
                    // which will make overall container taller, which will make textarea taller.
                    var text = $("#text-area").val().replace(/\n/g, '<br/>');
                    $("#text-copy").html(text);
                }
            };

            var data = {
                instructions:
                    'Type here to use the thesaurus. ' +
                    'After you type a word, press\nctrl + shift + space\n' +
                    'to show its synonyms.',
                setUpAutoResize: autoResizeFunction,
                _: _
            };

            var compiledTemplate = _.template( editorTemplate, data );
            $('#editor').html( compiledTemplate );
        }
    });

    return new synonymView;
});
