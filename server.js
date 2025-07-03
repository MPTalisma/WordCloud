const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// { "word": count, "anotherword": count }
let wordCounts = {}; // Stores the global word counts

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
    const initialWordsForClient = [];
    for (const word in wordCounts) {
        for (let i = 0; i < wordCounts[word]; i++) {
            initialWordsForClient.push(word);
        }
    }
    socket.emit('newWords', initialWordsForClient); // Client's updateWords function processes this array

    // --- ADDED THIS PART ---
    // Handle client-side 'clearCloud' event from the presenter
    socket.on('clearCloud', () => {
        console.log('Clear cloud request received from presenter.');
        wordCounts = {}; // Clear server's stored word counts
        io.emit('newWords', []); // Tell ALL connected clients to clear their words by sending an empty array
    });
    // --- END ADDED PART ---

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000; // Use PORT from environment or default to 3000
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});