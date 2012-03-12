var lazy = require('lazy'),
    fs   = require('fs'),
    db   = require('mongojs').connect('thesaurus', ['words']),

    count    = 0,
    lastWord = 'zoom'; // The last word in the dataset

function notCapitalized(str) { // returns true if str isn't capitalized, false otherwise
    return !((str[0] >= 'A') && (str[0] <= 'Z'));
}

// Returns synonym list of the format: [{ is: a, rating: 0 }, { is: b, rating: 0 }, ...]
function createSynonymList(synonyms) {
    var synonymList = [];

    for (var i = 0; i < synonyms.length; i++) {
        synonymList.push({
            is: synonyms[i],
            rating: 0
        });
    }

    return synonymList;
}

new lazy(fs.createReadStream('./data/mthesaur.txt'))
    .lines
    .map(String)
    .filter(notCapitalized) // Filter out pronouns since they tend to be irrelevant
    .forEach(
function(line, index, lineArray) {
    var wordArray = line.split(',');

    console.log('"' + wordArray[0] + '" - saving ...');

    count++;

    db.words.save({
        'is': wordArray[0],
        'synonyms': createSynonymList(wordArray.slice(1).filter(notCapitalized))

    }, function(error, saved) {
        if (error || !saved) {
            console.log('Word not saved! ' + error);
            process.exit(1);
        }
        else {
            console.log('"' + saved.is + '" saved.');
            if (saved.is === lastWord) {
                console.log('All ' + count + ' words successfully saved!');
                process.exit(0);
            }
        }
    });
});

