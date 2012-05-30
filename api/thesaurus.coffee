url       = require "url"
request   = require "request"
fs        = require "fs"
mongo     = require "mongojs"

config    = getConfiguration fs "api/config.json"
apiKey    = config.thesaurus_api_key
thesaurus = mongo.connect config.db_url, ["words"]

getConfiguration = (fs, path) ->
    try
        cfg = JSON.parse(fs.readFileSync(path).toString())
        cfg.db_url = "thesaurus" if process.env.NODE_ENV isnt "production"
        return cfg

    catch e
        console.error "There was an error getting configuration data:"
        console.log e
        process.exit 1

handleWordQuery = (request, response) ->
    word = processRequest(request)

    if word
        thesaurus.words.find is: word, (error, result) ->
                if error
                    console.error "There was an query error:"
                    console.log error

                else if result and result[0] and result[0].is is word
                    try
                        response.writeHead 200, "Content-type": "text/json"
                        response.end JSON.stringify result[0]

                    catch e
                        console.error "There was a parse error:"
                        console.log e
                else
                    accessApi word, response
    else
        response.writeHead 400
        response.end()

accessApi = (word, response) ->
    processWordData = (word, wordStr) ->
        word.is = wordStr
        word.rank = 0
        types = []
        strings = undefined
        objects = undefined
        for wordType of word
            if wordType isnt "is" and wordType isnt "rank"
                for listType of word[wordType]
                    strings = word[wordType][listType]
                    objects = []
                    if strings and strings.length
                        i = 0

                        while i < strings.length
                            objects.push is: strings[i]
                            i++
                        word[wordType][listType] = objects
                types.push wordType
        word.types = types
        word
    if apiKey
        url = "http://words.bighugelabs.com/api/2/" + apiKey + "/" + word + "/json"
        request url, (error, headers, body) ->
            if not error and headers.statusCode is 200
                try
                    wordObject = processWordData(JSON.parse(body), word)
                    response.writeHead 200,
                        "Content-type": "text/json"

                    response.end JSON.stringify(wordObject)
                    thesaurus.words.save wordObject, (error, saved) ->
                        if error or not saved
                            console.error "There was a problem saving a word:"
                            console.log error
                            console.log wordObject
                catch e
                    console.error "There was a parse error:"
                    console.log e
            else
                console.error "API access error:"
                console.log error
                console.log headers

handleWordUpdate = (request, response) ->
    words = processRequest(request)
    if words
        source = words.original
        synonym = words.replacement
        type = words.type
        synonymQuery = is: source
        synonymQuery[type + ".is"] = synonym
        synonymRankInc = $inc: {}
        synonymRankInc.$inc[type + ".$.rank"] = 1
        console.log synonymQuery
        console.log synonymRankInc
        thesaurus.words.update synonymQuery, synonymRankInc, (error, updated) ->
            thesaurus.words.find
                is: source
            , (e, result) ->
                console.log result

            if error
                console.error "Word not updated."
                console.log error
            else updated

processRequest = (request) ->
    validateGet = (data) ->
        (if ("word" of data.query) then data.query.word else null)
    validatePost = (data) ->
        (if ("original" of data.query and "replacement" of data.query and "type" of data.query) then data.query else null)
    data = url.parse(request.url, true)
    type = request.method
    return (if type is "GET" then validateGet(data) else validatePost(data))    if "query" of data and data.query and (type is "GET" or type is "POST")

module.exports.handleWordQuery = handleWordQuery
module.exports.handleWordUpdate = handleWordUpdate
