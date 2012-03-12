var url       = require('url'),
    thesaurus = require('mongojs').connect('thesaurus', ['words']);

function handleWordQuery(request, response) {

    function prettify(obj) {
        var output = '';
        for (property in obj) { output += property + ': ' + obj[property]+'\n'; }
        return output
    }

    var words = processRequest(request);

    if (words) { // Only respond to a correctly formed query string
        var body = {},
            searchCount = 0;

        // Iterate over the words provided in the query string
        // (will usually be just one)
        for (i = 0; i < words.length; i++) {

            // For each word, find its entry in the database
            thesaurus.words.find({ is: words[i] }, function(error, result) {
                if (error) {
                    console.log('There was an query error: ' + prettify(error));
                } else if (!result || !result[0] || !result[0].is) {
                    console.log('Word not found in thesaurus.');
                } else {
                    var word = result[0].is;

                    body[word] = processSearchResult(word, result);

                    // Increment the number of words that have been searched for
                    // Once this matches the total number words given in the
                    // query string, send the response.
                    searchCount++;
                    if (searchCount === words.length) {
                        response.writeHead(200, {'Content-type': 'text/json'});

                        try { response.end(JSON.stringify(body)); }
                        catch (e) {
                            console.log('There was a parse error: ' + prettify(e));
                        }
                    }
                }
            });
        }
    } else {
        response.writeHead(400);
        response.end();
    }
}

function handleWordUpdate(request, response) {
    var words       = processRequest(request),
        original    = words.original,
        replacement = words.replacement;

    if (words) { // Only respond to a correctly formed query string
        thesaurus.words.findOne({ word: original }, function(error, result) {
            var synonyms = result.synonyms,
                ratings  = result.ratings,
                synIndex = synonyms.indexOf(replacement);

            if (synIndex > 0) {
                ratings[synIndex]++;
            } else {
                // Add the new word and a rating for it
                synonyms.push(replacement);
                ratings.push(1);
            }

            // Update word with modified synonym+rating sets
            thesaurus.words.update({ word: original }, { $set: {
                synonyms: synonyms,
                ratings: ratings
            }}, function(error, updated) {
                if( err || !updated ) console.log("User not updated");
                else console.log('"' + updated.word + '" updated.');
            });
        });
    }
}

function processGet(data) {
    return ('word' in data.query) ? data.query.word : null;
}

function processPost(data) {
    return ('original' in data.query && 'replacement' in data.query) ?
        data.query : null;
}

function processRequest(request) {
    var data = url.parse(request.url, true),
        type = request.method,
        words;

    if ('query' in data && data.query && (type === 'GET' || type === 'POST')) {
        words = type === 'GET' ? processGet(data) : processPost(data);
    }

    return (typeof words === 'string') ? [words] : words;
}

function processSearchResult(word, entries) {
    var synonyms = [];

    if (entries instanceof Array) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].is === word) {
                synonyms = synonyms.concat(entries[i].synonyms || []);
            }
        }
    }

    return synonyms;
}

module.exports.handleWordQuery  = handleWordQuery;
module.exports.handleWordUpdate = handleWordUpdate;
