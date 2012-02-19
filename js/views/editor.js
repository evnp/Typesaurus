define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',

    'collections/words',
    'text!templates/editor.html'

], function($, _, Backbone, jQueryHotkeys, wordCollection, editorTemplate) {

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
                setUpAutoResize: autoResizeFunction,
                _: _
            };

            var compiledTemplate = _.template( editorTemplate, data );
            $('#editor').html( compiledTemplate );

            // Bind Synonym-Menu Hotkey
            $('#text-area').bind('keydown', 'ctrl+shift+space', function() {
                alert('You found the hotkey!');
            });
        }
    });

    return new synonymView;
});
