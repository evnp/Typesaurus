define([
    'jquery',
    'underscore',
    'backbone',

    'models/word'

], function($, _, Backbone, Word){

    var WordCollection = Backbone.Collection.extend({

        model: Word,

        // If the word exists clientside, return it.
        // Otherwise get it from the thesaurus.
        getWord: function (str) {
            return this.where(  { is: str })[0] ||
                   this.prepend({ is: str });
        },

        prepend: function (attributes) {
            this.unshift(attributes);
            return this.first();
        }
    });

    return WordCollection;
});
