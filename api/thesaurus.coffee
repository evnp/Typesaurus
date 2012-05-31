url     = require 'url'
request = require 'request'
fs      = require 'fs'
mongo   = require 'mongojs'


# Error handler
output = (msg, log...) ->
    console.error msg
    console.log item for item in log


getConfiguration = (fs, path) ->
    try
        cfg = JSON.parse(fs.readFileSync(path).toString())

        # Check whether the application is running in production
        cfg.db_url = 'thesaurus' if process.env.NODE_ENV isnt 'production'
        return cfg

    catch e
        output 'There was an error getting configuration data:', e
        process.exit 1


# Get API key and database url
config = getConfiguration fs, 'api/config.json'
apiKey = config.thesaurus_api_key

# Connect to the database
thesaurus = mongo.connect config.db_url, ['words']


processRequest = (request) ->
    validateGet = (data) -> return data.query.word
    validatePost = (data) -> return data.query if data.query.original? and
                                                  data.query.replacement? and
                                                  data.query.type?

    data = url.parse(request.url, true)
    type = request.method

    if data?.query and type in ['GET', 'POST']
        return if type is 'GET' then validateGet(data) else validatePost(data)


accessApi = (word, response) ->

    processWordData = (word, wordStr) ->

        # Convert synonym strings to objects
        convert = (type) ->
            for list of word[type]
                word[type][list] = (is: string for string in word[type][list])
            return type

        word.types = (convert type for type of word)
        word.is = wordStr
        word.rank = 0

        return word

    if apiKey
        request 'http://words.bighugelabs.com/api/2/' + apiKey + '/' + word + '/json',
            (error, headers, body) ->
                if not error and headers.statusCode is 200
                    try
                        wordObject = processWordData(JSON.parse(body), word)

                        # Send the wordObject to the client
                        response.writeHead 200, 'Content-type': 'text/json'
                        response.end JSON.stringify(wordObject)

                        # Save the wordObject to the database
                        thesaurus.words.save wordObject,
                            (error, saved) ->
                                if error or not saved
                                    msg = 'There was a problem saving a word:'
                                    output msg, error, wordObject

                    catch e
                        output 'There was a parse error:', e
                else
                    output 'API access error:', error, headers


handleWordQuery = (request, response) ->
    word = processRequest(request)

    if word # Only respond to correctly formed query string

        # Try to find the word's entry in the database
        thesaurus.words.find is: word,
            (error, result) ->
                if error
                    output 'There was an query error:', error

                # If the word was found, send it to the client
                else if result?[0]?.is is word
                    try
                        response.writeHead( 200, 'Content-type': 'text/json' )
                        response.end(JSON.stringify(result[0]))

                    catch e
                        output 'There was a parse error:', e

                # If the word wasn't found, get it from the API
                else accessApi( word, response )

    else
        response.writeHead 400
        response.end()


handleWordUpdate = (request, response) ->
    #    words = processRequest(request)
    #
    #    if word # Only respond to a correctly formed query strings
    #        source = words.original
    #        synonym = words.replacement
    #        type = words.type
    #
    #        # Finds synonym on word (if synonym is object
    #        synonymQuery = is: source
    #        synonymQuery[type + '.is'] = synonym
    #
    #        # Increments found synonym's rank.
    #        # $ operator is used to reference found synonym index
    #        # $inc operator increments present value
    #        synonymRankInc = $inc: {}
    #        synonymRankInc.$inc[type + '.$.rank'] = 1
    #
    #        console.log synonymQuery
    #        console.log synonymRankInc
    #
    #        thesaurus.words.update synonymQuery, synonymRankInc,
    #            (error, updated) ->
    #                thesaurus.words.find
    #                    is: source
    #                , (e, result) ->
    #                    console.log result
    #
    #                if error
    #                    output 'Word not updated', error


module.exports.handleWordQuery = handleWordQuery
module.exports.handleWordUpdate = handleWordUpdate
