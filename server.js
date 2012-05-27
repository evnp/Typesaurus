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
                // Url syntax accepted: /thesaurus?word=abc
                // Sends a JSON response containing the word and its synonyms.
                api.handleWordQuery(request, response);

            } else if (request.method === 'POST') {

                // POST
                // Url syntax accepted: /thesaurus?original=abc&replacement=efg
                //                      /thesaurus?inc_syn=abc&on=efg
                //                      /thesaurus?dec_syn=abc&on=efg
                // Sends a response confirming the update
                api.handleWordUpdate(request, response);
            }

        } else { // Serve static files for the frontend app
            site.serve(request, response);
        }
    });
}).listen(8080);


