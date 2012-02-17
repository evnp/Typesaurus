define([
    'jquery',
    'underscore',
    'backbone',

    'models/word'

], function($, _, Backbone, wordModel){

    var wordCollection = Backbone.Collection.extend({

        model: wordModel,

        initialize: function(){

        }
    });
 
    return new wordCollection;
});
