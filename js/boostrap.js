// Filename: bootstrap.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {

    // Modular Backbon loader - loads all Backbone dependencies
    loader: 'libs/backbone/loader',

    jQuery: 'libs/jquery/jquery',
    Underscore: 'libs/underscore/underscore',
    Backbone: 'libs/backbone/backbone'

    templates: '../templates'
  }
});

require([ 'app' ], function(App){ App.initialize(); });
