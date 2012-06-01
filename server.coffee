http = require 'http'
file = require 'node-static'
api  = require './api/thesaurus.js'

# Create static file server instance with app directory
site = new(file.Server)('./app')

http.createServer((request, response) ->
    request.addListener 'end', () ->

        # If request isn't to the api (subdomain '/thesaurus'),
        # serve static files for the frontend app
        if request.url.indexOf('/thesaurus') is -1
            site.serve request, response

        # Otherwise, send request through the thesaurus api 
        else
            if request.method is 'GET'

                # GET
                # Url syntax accepted: /thesaurus?word=abc
                # Sends a JSON response containing the word and its synonyms.
                api.handleWordQuery request, response

            else if request.method is 'POST'

                # POST
                # Url syntax accepted: /thesaurus?original=abc&replacement=efg
                #                      /thesaurus?inc_syn=abc&on=efg
                #                      /thesaurus?dec_syn=abc&on=efg
                # Sends a response confirming the update
                api.handleWordUpdate request, response

# Initialize the server on port 8080
).listen(8080);


