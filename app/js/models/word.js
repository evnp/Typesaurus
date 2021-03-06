define([
    'jquery',
    'underscore',
    'backbone'

], function($, _, Backbone) {

    /*
    Word Object Structure:
    {
        is: 'word',
        rank: <number>,
        types: [
            'noun',
            'verb',
            ...
        ],
        noun: {
            syn: [
                 { is: 'word' },
                 { is: 'word' },
                 {
                    is: 'word',
                    rank: <number>
                },
                ...
            ],
            rel: [
                 { is: 'word' },
                 { is: 'word' },
                ...
            ]
        },
        verb: {
            syn: ...
            rel: ...
        }
    }
    */

    var Word = Backbone.Model.extend({

        thesaurus_url: document.URL + 'thesaurus',

        defaults: { "rank": 0 },

        initialize: function(attributes){
            var word   = this
              , wordIs = this.get('is');

            $.ajax(this.thesaurus_url + '?word=' + wordIs, {

                type: 'GET',
                success: function (response) {
                    if (response && response.is === wordIs) {
                        word.set(response);
                    } else {
                        word.addToThesaurus();
                    }
                },
                error: function (request, stat, err) { console.log(err); },
            });
        },


/* -- Word Type Management -- */

        getPluralizedTypes: function () {
            return _.map(this.get('types'), function (word) {
                var last = word.charAt(word.length - 1);
                return word + ((last === 's' ||
                                last === 'x' ||
                                last === 'h') ? 'es' : 's');
            });
        },


/* -- Synonym Retrieval -- */

        // Gets string form of linked word at 'index'
        // in list selected via wordType + listType
        getSynonym: function(wordType, listType, index) {
            var word = this.getSynonymList(wordType, listType)[index];
            return word ? word.is : null;
        },

        // Gets multiple linked words from list selected via wordtype + listType
        // Accepts to/from parameters, just to, or neither.
        // Always gets highest ranked words first, and sorts them by rank.
        getSynonyms: function(wordType, listType, to, from) {
            var list   = this.getSynonymList(wordType, listType)
              , sorted = _.sortBy(list, function (syn) { return syn.rank || 0; })
              , words  = sorted.slice(from || 0, to || sorted.length);

            return _.pluck(words, 'is');
        },

        // Returns a complete synonym or related word list based on
        // wordType ('noun', 'verb', ...) and listType ('synonyms', 'related')
        getSynonymList: function (wordType, listType) {
            list = this.get(wordType);
            return (list ? list[listType] : null) || [];
        },


/* -- Synonym Ranking -- */

        handleReplace: function (wordStr, type) {
            var word =   this
              , wordIs = this.get('is');

            $.ajax(this.thesaurus_url +
                         '?original=' + wordIs +
                      '&replacement=' + wordStr +
                             '&type=' + type, {

                type: 'POST',
                success: function (response) {
                    console.log('response:');
                    console.log(response);
                    if (response) { word.incRankFor(wordStr, type); }
                },
                error: function (request, stat, err) { console.log(err); },
            });
        },

        incRank: function () { this.updateRank(1);  },
        decRank: function () { this.updateRank(-1); },

        updateRank: function (amount) {
            this.set('rank', this.get('rank') + amount);
        },

        incRankFor: function (wordStr, type) {
            this.updateRankFor(wordStr, type, 1);
        },

        decRankFor: function (wordStr, type) {
            this.updateRankFor(wordStr, type, -1);
        },

        updateRankFor: function (wordStr, type, amount) {
            var list = this.getSynonymList(type, 'syn')
              , synonym = _.find(list, function (word) {
                    return (word.is && word.is === wordStr) || word === wordStr; })
              , synIndex = list.indexOf(synonym);

            if (synIndex !== -1) {
                list[ synIndex ] = {
                    is:   wordStr,
                    rank: (synonym.rank || 0) + amount
                };

                this.set(type, list);
            }
        },

/* -- Custom Word Addition -- */

        addToThesaurus: function() {
            console.log('Adding ' + this.get('is') + ' to the thesaurus.');
        },


/* -- Utility -- */

        toClass: function() {
            return this.classFrom(this.get('is'));
        },

        // Returns wordStr with whitespace on either side removed, and any
        // whitespace sequences inside replaced with single '-' characters.
        classFrom: function (wordStr) {
            var split = wordStr.split(/\W+/g);

            if (split[0] === '') { split = split.splice(1); }
            if (split[split.length - 1] === '') {
                split = split.splice(0, split.length - 1);
            }

            return split.join('-');
        },

        // Return type if the word has it, the word's default type if not
        normalizeType: function (type) {
            return (this.get('types').indexOf(type) >= 0) ? type : this.defaultType();
        },

        // Return the first type of the word, or null if it doesn't exist
        defaultType: function () {
            var types = this.get('types');
            return types ? types[0] : null;
        }
    });

    return Word;
});
