define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/controls.html'

], function($, _, Backbone, controlsTemplate) {

    var ControlsView = Backbone.View.extend({

        el: '#controls',

        render: function(editor){
            var view = this;

            this.$el.html(_.template( controlsTemplate, {} ));

            this.$('#hotkey-auto-switch input').change(function (e) {
                var id = e.target.id,
                    hotkey = $('#hotkey-controls', view.el),
                    auto = $('#auto-controls', view.el);

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

