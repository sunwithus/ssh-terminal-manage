// script.js

window.addEventListener(
  'load',
  function () {
    const terminalContainer = document.getElementById('terminal-container');
    const commandButtonsContainer = document.getElementById('navigation-buttons');
    const commandsTextArea = document.getElementById('commands-text-area');

    const term = new Terminal({
      cursorBlink: true,
    });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();

    const socket = io();

    socket.on('connect', function () {
      term.write('\r\n*** Connected to backend ***\r\n');
    });

    term.onKey(function (ev) {
      socket.emit('data', ev.key);
    });

    socket.on('data', function (data) {
      const output = parseConsoleOutput(data);

      term.write(output);
    });

    // Логика парсинга того, что выводится
    function parseConsoleOutput(data) {
      // Здесь вы можете реализовать свою логику парсинга
      // и извлечения нужной части информации из консольного вывода

      // Ниже приведен пример простого парсинга, который просто оставляет строки, начинающиеся с ">> "
      const lines = data.split('\r\n');

      const filteredLines = lines;
      //const filteredLines = lines.map((line) => '<p style="color:red;">' + line + '</p>');
      //const filteredLines = lines.filter((line) => line.startsWith('>> '));
      console.log(filteredLines);
      // Возвращаем отфильтрованный вывод в виде строки
      return filteredLines.join('\r\n');
    }

    socket.on('disconnect', function () {
      term.write('\r\n*** Disconnected from backend ***\r\n');
    });

    /* document.getElementById('stop-command').addEventListener('click', () => stopCommand());
    function stopCommand() {
      // В обработчике события для кнопки "Stop"
      socket.emit('stop');
    }*/

    function handleCommandClick(command) {
      socket.emit('data', command + '\n');
    }

    function updateButtons(commands) {
      commandButtonsContainer.innerHTML = '';

      commands.forEach((command) => {
        const li = document.createElement('li');
        const a = document.createElement('a');

        a.textContent = command;
        a.href = '#';
        a.addEventListener('click', () => handleCommandClick(command));
        li.appendChild(a);
        commandButtonsContainer.appendChild(li);
      });
    }

    function loadCommands() {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/commands', true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const commands = JSON.parse(xhr.responseText);
            updateButtons(commands);
            commandsTextArea.value = commands.join('\n');
          } else {
            console.error('Error loading commands:', xhr.status);
          }
        }
      };
      xhr.send();
    }

    loadCommands();

    document.getElementById('save-button').addEventListener('click', () => {
      const commands = commandsTextArea.value
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/savecommands', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            updateButtons(commands);
          } else {
            console.error('Error saving commands:', xhr.status);
          }
        }
      };
      xhr.send(JSON.stringify({ commands: commands }));
    });
  },
  false
);
