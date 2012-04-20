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

            var compiledTemplate = _.template( controlsTemplate, data ),
                el = $('#controls');

            el.html( compiledTemplate );

            $('#hotkey-auto-switch input', el).change(function (e) {
                var id = e.target.id,
                    hotkey = $('#hotkey-controls', el),
                    auto = $('#auto-controls', el);

                if (id === 'auto') {
                    hotkey.fadeOut();
                    auto.fadeIn();
                } else if (id === 'hotkey') {
                    auto.fadeOut();
                    hotkey.fadeIn();
                }
            });
        }
    });

    return new controlsView;
});

