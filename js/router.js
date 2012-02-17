define([
    'jquery',
    'underscore',
    'backbone',

    'views/word/list',
    'views/user/list'
], function($, _, Backbone, wordListView, userListView){

    var AppRouter = Backbone.Router.extend({

        routes: {
            // Thesaurus
            'thesaurus/*words': 'lookUp',
            'thesaurus/update/:original/:replacement': 'recordReplacement',

            // Default
            '*actions': 'defaultAction'
        },

        lookUp: function(words) {
            alert(words);
            // Perform request to get words from the thesaurus
        },

        recordReplacement: function(original, replacement) {
            // Perform requests to update word ratings
        },

        defaultAction: function(actions){
            // We have no matching route, lets just log what the URL was
            console.log('No route:', actions);
        }
    });

    var initialize = function(){
        var app_router = new AppRouter;
        Backbone.history.start();
    };

    return {
        initialize: initialize
    };
});
