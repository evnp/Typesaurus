var db   = require('mongojs').connect('thesaurus', ['words']),
    words = ['dog', 'cat', 'boat', 'dog1', 'dog3'],
    data = [], i,
    saveCount = 0;

console.log('\nWords to save:');
for (i = 0; i < words.length; i++) { console.log(words[i]); }

for (i = 0; i < words.length; i++) {
    db.words.save({
        is: words[i],
        types: [
            'noun',
            'verb'
        ],
        noun: {
            syn: [
                words[i] + 1,
                words[i] + 2,
                words[i] + 3,
                words[i] + 4,
                words[i] + 5,
                words[i] + 6,
                words[i] + 7,
                words[i] + 8,
                words[i] + 9
            ],
            rel: [
                words[i] + 100,
                words[i] + 200,
                words[i] + 300
            ]
        },
        verb: {
            syn: [
                words[i] + 11,
                words[i] + 12,
                words[i] + 13,
                words[i] + 14,
                words[i] + 15,
                words[i] + 16,
                words[i] + 17,
                words[i] + 18,
                words[i] + 19
            ],
            rel: [
                words[i] + 300,
                words[i] + 400,
                words[i] + 500
            ]
        }
    });

    db.words.find({is: words[i]}, function (error, result) {
        if (!error && result) {
            console.log('\nWord successfully saved.');
            console.log(result);
            saveCount++;
 
            if (saveCount >= words.length) {
                console.log('\nAll ' + words.length + ' words saved successfully');
                process.exit(0);
            }
        } else {
            console.log('Word not saved!');
            console.log(error);
            process.exit(1);
        }
    });
}






