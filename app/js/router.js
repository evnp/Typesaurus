define([
    'jquery',
    'underscore',
    'backbone',

    'views/main',
    'views/word/list',
    'views/user/list'
], function($, _, Backbone, MainView, wordListView, userListView){

    var AppRouter = Backbone.Router.extend({

        routes: {
            // Thesaurus
            'thesaurus/*words': 'lookUp',
            'thesaurus/update/:original/:replacement': 'recordReplacement',

            // Default
            '*actions': 'showMain'
        },

        lookUp: function(words) {
            alert(words);
            // Perform request to get words from the thesaurus
        },

        recordReplacement: function(original, replacement) {
            // Perform requests to update word ratings
        },

        showMain: function(actions){
            this.mainView.render();
        }
    });

    var initialize = function(){
        var app_router = new AppRouter;
        app_router.mainView = new MainView;
        Backbone.history.start();
    };

    return {
        initialize: initialize
    };
});
