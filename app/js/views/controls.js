define([
    'jquery',
    'underscore',
    'backbone',

    'text!templates/controls.html'

], function($, _, Backbone, controlsTemplate) {

    var ControlsView = Backbone.View.extend({

        el: '#controls',

        initialize: function () {
            this.controlsHidden = false;
            this.mode = 'hotkey';
        },

        render: function(editor){
            var view = this;

            this.$el.html(_.template( controlsTemplate, {} ));

            this.$('#hotkey-auto-switch input').change(function (e) {
                var hotkey = $('#hotkey-controls', view.el)
                  , auto = $('#auto-controls', view.el);

                view.mode = e.target.id;

                if (view.mode === 'auto') {
                    hotkey.fadeOut();
                    auto.fadeIn();
                } else if (view.mode === 'hotkey') {
                    auto.fadeOut();
                    hotkey.fadeIn();
                }

                editor.switchMode();
            });

            var arrow = this.$('.show-hide')
              , label = this.$('#show-label')
              , content = view.$('.content *');

            $('.show-hide, #show-label').click(function (e) {
                var newAngle = parseFloat(arrow.css('text-indent')) ? 0 : -90

                // Get all elements except the inactive mode control, which is already hidden.
                  , controls =
                $(_.reject(content, function (element) {
                    var inactiveMode = view.mode === 'auto' ? 'hotkey' : 'auto';
                    return $(element).attr('id') === inactiveMode + '-controls';
                }));

                // Arrow Rotation:
                // jQuery can't animate transforms. So we animate a property
                // we don't care about (textIndent) and feed the value to a
                // step function that will set the transform value properly.
                arrow.animate({ textIndent: newAngle }, {
                    step: function(angle) {
                        var value = 'rotate(' + angle + 'deg)';
                        arrow.css('-webkit-transform', value);
                        arrow.css('-moz-transform',    value);
                        arrow.css('transform',         value);
                    }
                });

                if (view.controlsHidden) {
                    label.fadeOut();
                    controls.fadeIn();
                } else {
                    label.fadeIn();
                    controls.fadeOut();
                }

                view.controlsHidden = !view.controlsHidden;
            });
        }
    });

    return ControlsView;
});

