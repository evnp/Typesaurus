var http      = require('http'),
    file      = require('node-static'),
    api       = require('./api/thesaurus.js');

// Create static file server instance with app directory
var site = new(file.Server)('./app');

http.createServer(function (request, response) {
    request.addListener('end', function () {

        // If request is to the api, at subdomain '/thesaurus'...
        if (request.url.indexOf('/thesaurus') !== -1) {
            if (request.method === 'GET') {

                // GET
                // Url form accepted: /thesaurus?word=abc
                // Sends a JSON response containing the word and their synonyms.
                api.handleWordQuery(request, response);

            } else if (request.method === 'POST') {

                // POST
                // Url form accepted: /thesaurus/update?original=abc&replacement=efg
                // Sends a response confirming the update
                api.handleWordUpdate(request, response);
            }

        } else { // Serve static file for the frontend app
            site.serve(request, response);
        }
    });
}).listen(8080);


