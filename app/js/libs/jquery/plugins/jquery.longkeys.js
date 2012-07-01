(function ($) {

    $.each(['keydown', 'keypress'], function (i, type) {

        var customEvent = 'long' + type;

        $.event.special[customEvent] = {
            setup: function (data) {

                var el = $(this)
                  , keyPressed   = false
                  , timerRunning = false
                  , keyCode = null

                    // True if using jQuery Hotkeys
                  , jQueryHotkeys = Boolean($.hotkeys && data.key);

                // Bind the events: (keydown|keypress) and keyup.
                // If the event is for a specific key,
                // use jquery.hotkeys syntax for event binding.
                el[type].apply(el, jQueryHotkeys ? [data.key, down] : [down]);
                el.keyup.apply(el, jQueryHotkeys ? [data.key,  up ] : [ up ]);

                // Store the handlers for later unbinding
                el.data('handlers', { down: down, up: up });

                function down(e) {
                    if (keyPressed === false) {

                        // Execute pre-delay callback
                        if (data.before) data.before();

                        // If not using jQuery Hotkeys, cache the key code
                        // to make sure down and up handlers use the same key
                        if (!jQueryHotkeys) keyCode = e.which;

                        keyPressed = timerRunning = true;

                        setTimeout(function () {
                            timerRunning = false;
                            if (keyPressed) el.trigger(customEvent);
                        }, data.duration);
                    }

                    return false;
                }

                function up(e) {
                    if (jQueryHotkeys || (e.which === keyCode)) {
                        if (keyPressed && timerRunning) data.onShortPress();
                        keyPressed = false;
                        keyCode = null;
                    }

                    return false;
                }
            },

            teardown: function () {
                var handlers = el.data('handlers');
                if (handlers) {
                    if (handlers.down) $(this).unbind(type,  handlers.down);
                    if (handlers.up)   $(this).unbind(keyup, handlers.up);
                }
            }
        }
    });

})(jQuery);
