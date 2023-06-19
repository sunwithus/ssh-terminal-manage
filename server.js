const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
});
app.set('view engine', 'ejs');
app.use(
  express.urlencoded({
    extended: false,
    limit: '150mb',
  })
);
app.use(express.static(__dirname + '/public'));
app.use('/xterm.css', express.static(require.resolve('xterm/css/xterm.css')));
app.use('/xterm.js', express.static(require.resolve('xterm')));
app.use('/xterm-addon-fit.js', express.static(require.resolve('xterm-addon-fit')));

app.use(express.json()); // Для парсинга JSON
app.use(express.urlencoded({ extended: false })); // Для парсинга URL-кодированного тела запроса

const SSHClient = require('ssh2').Client;

app.get('/', (req, res) => {
  // res.sendFile(__dirname + '/index.html');
  res.render('index');
  // I am using ejs as my templating engine but HTML file work just fine.
});

app.get('/commands', (req, res) => {
  const filePath = path.join(__dirname, 'commands.txt');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading commands file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      const commands = data.split('\n').filter((line) => line.trim() !== '');
      res.send(commands);
    }
  });
});

app.post('/savecommands', (req, res) => {
  const commands = req.body.commands;
  const filePath = path.join(__dirname, 'commands.txt');

  fs.writeFile(filePath, commands.join('\n'), 'utf8', (err) => {
    if (err) {
      console.error('Error saving commands file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.sendStatus(200);
    }
  });
});

io.on('connection', function (socket) {
  var conn = new SSHClient();
  conn
    .on('ready', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
      conn.shell(function (err, stream) {
        if (err) return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
        socket.on('data', function (data) {
          stream.write(data);
        });
        stream
          .on('data', function (d) {
            socket.emit('data', d.toString('binary'));
          })
          .on('close', function () {
            conn.end();
          });
      });
    })

    .on('close', function () {
      socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
    })
    .on('error', function (err) {
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
    })
    .connect({
      host: '192.168.121.128',
      port: 22,
      username: 'admin',
      password: '1',
    });
});

http.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
