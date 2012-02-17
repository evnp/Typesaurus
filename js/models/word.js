define([
    'underscore',
    'backbone'
], function(_, Backbone) {

    var wordModel = Backbone.Model.extend({

        defaults: {
            is:       '',
            def:      '',
            synonyms: []
        },

        initialize: function(){
        }
    });

    return wordModel;
});
