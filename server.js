"use strict";

const IP = "127.0.0.1";
const PORT = 8081;

const express = require("express");
const app = express();
app.use(express.static("public"));

const http = require("http");
const socketIo = require("socket.io");
const webServer = http.Server(app);
const io = socketIo(webServer);

let gameModule = require("./GameModule.js");

let clients = [];
let viewerArray = [];

const newGame = new gameModule.Game();

io.on("connection", socket => {

    socket.emit("push");
    clients.push(socket);

    const player1 = clients[0];

    const player2 = clients[1];

    const startPlayer = newGame.currentPlayer;
    const secondPlayer = newGame.secondPlayer;

    clients[0].emit('startPlayer',startPlayer);
    if (clients[1]) clients[1].emit('secondPlayer',startPlayer);

    io.emit("Am Zug: ...", startPlayer);

    if (clients.length == 1) socket.emit("messageWait");
    else io.emit("messageStart");

    if (clients.length == 2){
    clients[0].on('move', (field) => {
      const message = newGame.move(startPlayer,field);
        clients.forEach(x => x.emit('emptyInfo3'));
      if (message === 'Ungueltiger Zug: X ist nicht am Zug!' || message === 'Ungueltiger Zug: Feld 2 ist nicht frei!') {
        clients[0].emit('enableClient0');
        clients[1].emit('disableClient1');
        clients[0].emit('messageForMove',message);
        clients[1].emit('messageForMove',message);
      }
      else {
        clients[0].emit('disableClient0');
        clients[1].emit('enableClient1');
      };

      io.emit("Am Zug: ...", secondPlayer);

      if (message === 'Spiel beendet: Spieler X hat gewonnen!' || message === 'Spiel beendet: Spieler O hat gewonnen!' || message === 'Spiel endet unentschieden!') {
        io.emit('endMessage',message);
        clients[0].emit('disableClient0');
        clients[1].emit('disableClient1');

      };

    });

    clients[1].on('move', (field) => {
      const message = newGame.move(secondPlayer,field);
        clients.forEach(x => x.emit('emptyInfo3'));
      if (message === 'Ungueltiger Zug: X ist nicht am Zug!' || message === 'Ungueltiger Zug: Feld 2 ist nicht frei!') {
        clients[1].emit('enableClient1');
        clients[0].emit('disableClient0');
        clients[0].emit('messageForMove',message);
        clients[1].emit('messageForMove',message);
      }
      else {
        clients[1].emit('disableClient1');
        clients[0].emit('enableClient0');
      };

      io.emit("Am Zug: ...", startPlayer);

      if (message === 'Spiel beendet: Spieler X hat gewonnen!' || message === 'Spiel beendet: Spieler O hat gewonnen!' || message === 'Spiel endet unentschieden!') {
        io.emit('endMessage',message);     
        clients[0].emit('disableClient0');
        clients[1].emit('disableClient1');
      };
    })};

    if (clients.length > 2) {
      viewerArray.push(socket);
      viewerArray.forEach(x => x.emit('viewerMessage'));
    };


    clients.forEach(client => client.on('move', () => {io.emit('gameField', newGame.gameField)}));

    clients.forEach(client => client.on('move', () => {io.emit('gameField', newGame.gameField)}));

});







webServer.listen(PORT, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);
});
