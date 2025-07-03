const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Change wordData from an array to an object/Map to store counts
// { "word": count, "anotherword": count }
let wordCounts = {}; // Renamed from wordData for clarity

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/form', (req, res) => res.sendFile(path.join(__dirname, 'public/form.html')));
app.get('/cloud', (req, res) => res.sendFile(path.join(__dirname, 'public/cloud.html')));

app.post('/submit', (req, res) => {
    const word1 = req.body.word1?.trim();
    const word2 = req.body.word2?.trim();

    const wordsToEmit = []; // This array will hold only the words just submitted

    if (word1) {
        const lowerWord1 = word1.toLowerCase();
        wordCounts[lowerWord1] = (wordCounts[lowerWord1] || 0) + 1; // Increment count
        wordsToEmit.push(lowerWord1); // Add to the list of words to emit
    }
    if (word2) {
        const lowerWord2 = word2.toLowerCase();
        wordCounts[lowerWord2] = (wordCounts[lowerWord2] || 0) + 1; // Increment count
        wordsToEmit.push(lowerWord2); // Add to the list of words to emit
    }

    // --- THE FIX ---
    // Emit only the words that were just submitted and whose counts were incremented
    if (wordsToEmit.length > 0) {
        io.emit('newWords', wordsToEmit);
    }

    res.redirect('/form'); // Redirect back to the form
});

io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);
    // When a new client connects, send them the *entire current state* of word counts
    // so they can build the initial word cloud.
    // The client's updateWords function expects an array of strings.
    // We need to send an array where each word appears 'count' times,
    // or modify the client to accept a {word: count} object for initial state.

    // Option 1 (Matches current client `updateWords` expecting array of words)
    // This is less efficient for large counts but works directly with your current client.
    const initialWordsForClient = [];
    for (const word in wordCounts) {
        for (let i = 0; i < wordCounts[word]; i++) {
            initialWordsForClient.push(word);
        }
    }
    socket.emit('newWords', initialWordsForClient);


    // Option 2 (More efficient, but requires minor client-side change for initial state)
    // socket.emit('initialWordCounts', wordCounts); // Client needs a new handler for 'initialWordCounts'
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));