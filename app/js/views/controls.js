define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/controls.html'

], function($, _, Backbone, controlsTemplate) {

    var ControlsView = Backbone.View.extend({

        el: $('#controls'),

        render: function(editor){
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

                editor.switchMode();
            });
        }
    });

    return ControlsView;
});

