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

let clients = [];
let viewerArray = [];

const newGame = new gameModule.Game();

let indexObject = {
  i: -1
};



io.on("connection", socket => {    

    indexObject.i = indexObject.i + 1;    
    socket.emit('push');
    socket.emit('hide-start-button');   

    if (clients.length == 2 && clients[0] != 'no-player' && clients[1] != 'no-player') {
      // console.log("array full");     
      // console.log(clients.length);   
      viewerArray.push(socket); 
      // let arrayOfSockets = viewerArray.filter((el) => el != 'no-viewer');     
      viewerArray.forEach(x => x.emit('viewerMessage'));           
    }

    if (clients.length < 2) {
      // console.log('clients.length < 2');
      clients.push(socket);
    };    

    if (clients.includes('no-player')) {
      // console.log("clients.includes('no-player')");
      
      clients[clients.indexOf('no-player')] = socket;
    };    

    // console.log(viewerArray.length);

    

    const startPlayer = newGame.currentPlayer;
    const secondPlayer = newGame.secondPlayer;


    if (clients[0]) clients[0].emit('startPlayer',startPlayer);

    if (clients[1]) clients[1].emit('secondPlayer',startPlayer);

    io.emit("Am Zug: ...", startPlayer);

    if (clients.length == 1) socket.emit("messageWait");
    else io.emit("messageStart");

    if (clients[0] && clients[1]) {
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
  };

    if (clients[0] && clients[1]) {     

      clients[0].emit('show-start-button');
     
      clients[0].emit('disableClient0');
      clients[1].emit('disableClient1');
                  
      clients[0].on('move', (field) => {
        const message = newGame.move(startPlayer,field);
        io.emit('gameField', newGame.gameField);       
        clients.forEach(x => x.emit('emptyInfo3'));
        
        clients[0].emit('disableClient0');
        clients[1].emit('enableClient1');        

        io.emit("Am Zug: ...", secondPlayer);        

        if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
          io.emit('endMessage',message);
          clients[0].emit('disableClient0');
          clients[1].emit('disableClient1');
        };
        io.emit('disableOccupiedFields', newGame.gameField);
      });

      clients[1].on('move', (field) => {
        const message = newGame.move(secondPlayer,field);
        io.emit('gameField', newGame.gameField);
        
        clients.forEach(x => x.emit('emptyInfo3'));
        
        clients[1].emit('disableClient1');
        clients[0].emit('enableClient0');   
        io.emit("Am Zug: ...", startPlayer);        

        if (message === 'Spiel beendet: Spieler X hat das Spiel gewonnen!' || message === 'Spiel beendet: Spieler O hat gewonnen!' || message === 'Spiel endet unentschieden!') {
          io.emit('endMessage',message);     
          clients[0].emit('disableClient0');
          clients[1].emit('disableClient1');
        };        
        io.emit('disableOccupiedFields', newGame.gameField);
      });
    };   
    
    if (clients[0]) {clients[0].on('disconnect', () => {             
      clients[0] = 'no-player';    
      indexObject.i = -1;
      gameObject.gameField = ["","","","","","","","",""];
      io.emit('gameField', newGame.gameField); 
      io.emit('messagePlayerDisconnected');
      io.emit("messageWait");
      io.emit('emptyInfo2');
      io.emit('hide-start-button');    
      if (clients[0] == 'no-player' && clients[1] == 'no-player') clients = [];    
    })};    

    if (clients[1]) {clients[1].on('disconnect', () => {
      clients[1] = 'no-player';      
      indexObject.i = 0;
      gameObject.gameField = ["","","","","","","","",""];
      io.emit('gameField', newGame.gameField); 
      io.emit('messagePlayerDisconnected');
      io.emit("messageWait");
      io.emit('emptyInfo2');
      io.emit('hide-start-button');      
      if (clients[0] == 'no-player' && clients[1] == 'no-player') clients = [];      
    })};  

    const fn = (socket) => {
      // viewerArray[(viewerArray.indexOf(socket))] = 'no-viewer';
      delete viewerArray[(viewerArray.indexOf(socket))]
      let arrayOfSockets = viewerArray.filter((el) => el != undefined);
      console.log(arrayOfSockets.length);
    }

    if (viewerArray[0]) {viewerArray.map((socket,index) => socket.on('disconnect', () => fn(socket)))};
     
      

      
   
});




webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);
});