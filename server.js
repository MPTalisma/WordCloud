const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let wordData = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/form', (req, res) => res.sendFile(path.join(__dirname, 'public/form.html')));
app.get('/cloud', (req, res) => res.sendFile(path.join(__dirname, 'public/cloud.html')));

app.post('/submit', (req, res) => {
  const word1 = req.body.word1?.trim();
  const word2 = req.body.word2?.trim();

  if (word1) wordData.push(word1.toLowerCase());
  if (word2) wordData.push(word2.toLowerCase());

  io.emit('newWords', wordData);
  res.redirect('/form');
});

io.on('connection', socket => {
  socket.emit('newWords', wordData);
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));