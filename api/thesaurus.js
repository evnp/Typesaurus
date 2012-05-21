var url       = require('url')
  , request   = require('request')
  , config    = getConfiguration(require('fs'), 'api/config.json')
  , apiKey    = config.thesaurus_api_key
  , thesaurus = require('mongojs').connect(config.db_url, ['words']);

function getConfiguration(fs, path) {
    try {
        var cfg = JSON.parse(fs.readFileSync(path).toString());

        // Check whether the application is running in production
        if (process.env.NODE_ENV !== 'production') {
            cfg.db_url = 'thesaurus';
        }

        return cfg;

    } catch (e) {
        console.error('There was an error getting configuration data:');
        console.log(e);
        process.exit(1);
    }
}

function handleWordQuery(request, response) {
    var word = processRequest(request);

    if (word) { // Only respond to a correctly formed query string

        // Try to find the word's entry in the database
        thesaurus.words.find({ is: word }, function(error, result) {

            if (error) {
                console.error('There was an query error:');
                console.log(error);

            } else if (result && result[0] && result[0].is === word) {

                // If the word was found, send it as JSON
                try {
                    response.writeHead(200, {'Content-type': 'text/json'});
                    response.end(JSON.stringify(result[0]));
                } catch (e) {
                    console.error('There was a parse error:');
                    console.log(e);
                }

            } else { // If the word wasn't found, get it from the API:
                accessApi(word, response);
            }
        });

    } else {
        response.writeHead(400);
        response.end();
    }
}

function accessApi(word, response) {

    if (apiKey) {
        var url = 'http://words.bighugelabs.com/api/2/' + apiKey + '/' + word + '/json';

        request(url, function (error, headers, body) {
            if (!error && headers.statusCode == 200) {
                try {
                    // Create a new word object
                    var wordObject = JSON.parse(body);
                    wordObject.is  = word;

                    // Send the word to the application
                    response.writeHead(200, {'Content-type': 'text/json'});
                    response.end(JSON.stringify(wordObject));

                    // Save the word in the database
                    thesaurus.words.save(wordObject, function (error, saved) {
                        if (error || !saved) {
                            console.error('There was a problem saving a word:');
                            console.log(error);
                            console.log(wordObject);
                        }
                    });
                } catch (e) {
                    console.error('There was a parse error:');
                    console.log(e);
                }
            } else {
                console.error('API access error:');
                console.log(error);
                console.log(headers);
            }
        });
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

function processRequest(request) {
    var data = url.parse(request.url, true),
        type = request.method;

    if ('query' in data && data.query && (type === 'GET' || type === 'POST')) {
        return type === 'GET' ? processGet(data) : processPost(data);
    }

    function processGet(data) {
        return ('word' in data.query) ? data.query.word : null;
    }

    function processPost(data) {
        return ('original' in data.query && 'replacement' in data.query) ?
            data.query : null;
    }
}

module.exports.handleWordQuery  = handleWordQuery;
module.exports.handleWordUpdate = handleWordUpdate;
