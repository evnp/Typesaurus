define([
    'jquery',
    'underscore',
    'backbone'

], function($, _, Backbone) {

    var Word = Backbone.Model.extend({

        thesaurus_url: 'http://localhost:8080/thesaurus',

        initialize: function(attributes){
            var word = this
                wordIs = this.get('is'),
                url = this.thesaurus_url;

            $.ajax(url + '?word=' + wordIs, {
                success: function (response) {
                    if (response && response.is === wordIs) {
                        word.set(response);
                        console.log(word);
                    } else {
                        word.addToThesaurus();
                    }
                },
                error: function (request, stat, err) { console.log(err); },
            });
        },

        addSynonym: function(newSyn) {
            // Normalize as a dict with rating 0 unless it is specified
            newSyn = (typeof newSyn === 'string') ? { is: newSyn } : newSyn;
            if (!newSyn.rating) { newSyn.rating = 0; }

            var synonyms = this.get('synonyms');

            // Insert the new synonym in front of the first one found
            // that has an equal or lower rating.
            synonyms.splice(_.find(synonyms, function(syn) {
                return syn.rating <= newSyn.rating;
            }), 0, newSyn);

            this.set({ synonyms: synonyms });
        },

        getSynonym: function(index) {
            return this.get('synonyms')[index];
        },

        // Accepts to/from parameters, just to, or neither.
        getSynonyms: function(to, from) {
            var synonyms = this.get('synonyms');
            return synonyms.splice(from || 0, to || synonyms.length);
        },

        addToThesaurus: function() {
            console.log('Adding ' + this.get('is') + ' to the thesaurus.');
        },

        getAsClass: function() {
            return this.classFrom(this.get('is'));
        },

        classFrom: function (wordStr) {
            var split = wordStr.split(/\W+/g);

            if (split[0] === '') { split = split.splice(1); }
            if (split[split.length - 1] === '') {
                split = split.splice(0, split.length - 1);
            }

            return split.join('-');
        }
    });

    return Word;
});
