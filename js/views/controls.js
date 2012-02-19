define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/controls.html'

], function($, _, Backbone, controlsTemplate) {

    var controlsView = Backbone.View.extend({

        el: $('#controls'),

        initialize: function(){
        },

        render: function(){
            var data = {
                _: _
            };

            var compiledTemplate = _.template( controlsTemplate, data );
            $('#controls').html( compiledTemplate );
        }
    });

    return new controlsView;
});

