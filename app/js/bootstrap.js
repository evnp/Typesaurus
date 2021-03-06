require.config({
    paths: {
        jquery:     'libs/jquery/jquery-min',
        jqhotkeys:  'libs/jquery/plugins/jquery.hotkeys.min',
        jqlongkeys: 'libs/jquery/plugins/jquery.longkeys.min',
        jqcolor:    'libs/jquery/plugins/jquery.color.min',
        underscore: 'libs/underscore/underscore-1.3.2-amd-min',
        backbone:   'libs/backbone/backbone-0.9.2-amd-min',
        areagami:   'libs/area.gami/area.gami.min',

        text: 'libs/require/text',
        templates: '../templates'
    }
});

require([ 'app' ], function(App) {
    App.initialize();
});
