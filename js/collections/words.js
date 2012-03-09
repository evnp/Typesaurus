define([
    'jquery',
    'underscore',
    'backbone',

    'models/word'

], function($, _, Backbone, Word){

    var WordCollection = Backbone.Collection.extend({

        model: Word,

        initialize: function(){

        }
    });
 
    return new WordCollection;
});
