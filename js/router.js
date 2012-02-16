define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/projects/list',
    'views/users/list'
], function($, _, Backbone, Session, projectListView, userListView){

    var AppRouter = Backbone.Router.extend({

        routes: {
            // Thesaurus
            'thesaurus/*words: 'lookUp',
            'thesaurus/update/:original/:replacement': 'recordReplacement',

            // Default
            '*actions": "defaultAction'
        },

        lookUp: function(words) {
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
