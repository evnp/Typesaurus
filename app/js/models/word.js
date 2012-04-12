define([
    'underscore',
    'backbone'

], function(_, Backbone) {

    var Word = Backbone.Model.extend({

        defaults: {
            is:       '',
            type:     'unknown',
            def:      '',
            synonyms: [] // [{ is: 'wordA', rating: 3 },
                         //  { is: 'wordB', rating: 2 },
                         //  { is: 'wordC', rating: 1 }]
        },

        initialize: function(){
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
            var synonym = this.get('synonyms')[index];
            if (synonym) { return synonym.is; }
        },

        // Accepts to/from parameters, just to, or neither.
        getSynonyms: function(to, from) {
            from = from || 0;
            to   = to && to > synonyms.length ? to : synonyms.length;

            var synonyms = this.get('synonyms'),
                list     = [];

            for (var i = from; i <= to; i++) {
                list.push(synonyms[i].is);
            }

            return list;
        }
    });

    return Word;
});
