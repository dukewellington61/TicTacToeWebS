"use strict";

const IP = "127.0.0.1";
const HOST = '0.0.0.0'
const PORT = process.env.PORT || 8081;

const express = require("express");
const app = express();
app.use(express.static("public"));

const http = require("http");
const socketIo = require("socket.io");
const webServer = http.Server(app);
const io = socketIo(webServer);

let gameModule = require("./GameModule.js");


let clients = new Array();
let viewerArray = [];

const newGame = new gameModule.Game();

let indexObject = {
  i: -1
};



io.on("connection", socket => {    

    indexObject.i = indexObject.i + 1;

    if (clients[0] && clients[1]) {
      viewerArray.push(socket);
      viewerArray.forEach(x => x.emit('viewerMessage'));
    }
    else clients[indexObject.i] = socket; 
        
    socket.emit('push');
        
    socket.emit('hide-start-button');  

    if (viewerArray.length > 0) return;

    gameObject.gameField = ["","","","","","","","",""];

    const startPlayer = newGame.currentPlayer;
    const secondPlayer = newGame.secondPlayer;


    if (clients[0]) clients[0].emit('startPlayer',startPlayer);
    if (clients[1]) clients[1].emit('secondPlayer',startPlayer);

    io.emit("Am Zug: ...", startPlayer);


    if (clients.length == 1) socket.emit("messageWait");
    else io.emit("messageStart");

    if (clients[0] && clients[1]) {

      clients[0].emit('show-start-button');
     
      clients[0].emit('disableClient0');
      clients[1].emit('disableClient1');

      clients.forEach(client => client.on('newGame', () => {
        clients[0].emit('enableClient0');
        gameObject.gameField = ["","","","","","","","",""];
        io.emit('gameField', newGame.gameField);  
        io.emit("messageStart");
        clients[0].emit('startPlayer',startPlayer);
        clients[1].emit('secondPlayer',startPlayer);
        io.emit("Am Zug: ...", startPlayer);
        io.emit('hide-start-button');
        io.emit('game-has-started');
      }));    

      let i = 0;
      let j = 0;
                       
      clients[0].on('move', (field) => {
        const message = newGame.move(startPlayer,field);
        io.emit('gameField', newGame.gameField);
        console.log(`client 0 move no: ${i+=1}`);
        console.log(newGame.gameField);
        clients.forEach(x => x.emit('emptyInfo3'));

        if (message === 'Ungueltiger Zug: Feld 2 ist nicht frei!') {
          clients[0].emit('enableClient0');
          clients[1].emit('disableClient1');
          clients[0].emit('messageForMove',message);
          clients[1].emit('messageForMove',message);
          io.emit("Am Zug: ...", startPlayer);
        }
        else {
          clients[0].emit('disableClient0');
          clients[1].emit('enableClient1');
          io.emit("Am Zug: ...", secondPlayer);
        };        

        if (message === 'Spiel beendet: Spieler X hat gewonnen!' || message === 'Spiel beendet: Spieler O hat gewonnen!' || message === 'Spiel endet unentschieden!') {
          io.emit('endMessage',message);
          clients[0].emit('disableClient0');
          clients[1].emit('disableClient1');
        };
      });

      clients[1].on('move', (field) => {
        const message = newGame.move(secondPlayer,field);
        io.emit('gameField', newGame.gameField);
        console.log(`client 1 move no: ${j+=1}`);
        console.log(newGame.gameField)
        clients.forEach(x => x.emit('emptyInfo3'));

        if (message === 'Ungueltiger Zug: Feld 2 ist nicht frei!') {
          clients[1].emit('enableClient1');
          clients[0].emit('disableClient0');
          clients[0].emit('messageForMove',message);
          clients[1].emit('messageForMove',message);
          io.emit("Am Zug: ...", secondPlayer);
        }
        else {
          clients[1].emit('disableClient1');
          clients[0].emit('enableClient0');
          io.emit("Am Zug: ...", startPlayer);
        };
        
        if (message === 'Spiel beendet: Spieler X hat das Spiel gewonnen!' || message === 'Spiel beendet: Spieler O hat gewonnen!' || message === 'Spiel endet unentschieden!') {
          io.emit('endMessage',message);     
          clients[0].emit('disableClient0');
          clients[1].emit('disableClient1');
        };
      });
    }; 
      
    if (clients[0]) {clients[0].on('disconnect', () => {             
      delete clients[0];
      indexObject.i = -1;
      gameObject.gameField = ["","","","","","","","",""];
      io.emit('gameField', newGame.gameField); 
      io.emit('messagePlayerDisconnected');
      io.emit("messageWait");
      io.emit('emptyInfo2');
      io.emit('hide-start-button');   
      process.exit(1);
    })};    

    if (clients[1]) {clients[1].on('disconnect', () => {
      delete clients[1];
      indexObject.i = 0;
      gameObject.gameField = ["","","","","","","","",""];
      io.emit('gameField', newGame.gameField); 
      io.emit('messagePlayerDisconnected');
      io.emit("messageWait");
      io.emit('emptyInfo2');
      io.emit('hide-start-button');    
      process.exit(1);
    })};  
});




webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);
});
