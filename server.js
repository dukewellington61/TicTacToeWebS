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
      //    
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

    let arrayOfClientSockets = clients.filter((el) => el != 'no-player');  
    let arrayOfViewerSockets = viewerArray.filter((el) => el != 'no-viewer');  

    console.log('clients.length BEFORE disconnect ' + arrayOfClientSockets.length);
    console.log('viewerArray.length BEFORE disconnect ' + arrayOfViewerSockets.length);

    

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
    
    // const reconnectClients = socket => socket.reconnect(PORT,HOST);
    

    const addViewerToClients = () => {
      
      if (arrayOfViewerSockets[0]) {
        clients[clients.indexOf('no-player')] = arrayOfViewerSockets[0];         
        // delete arrayOfViewerSockets[0];
        for (let i = 0; i < viewerArray.length; i++) {
          if (viewerArray[i] != 'no-viewer') {
            delete viewerArray[i];
            break;
          };
        };
      };
        
      
      location.reload(true);
      let arrayOfClientSockets1 = clients.filter((el) => el != 'no-player');  
      let arrayOfViewerSockets1 = viewerArray.filter((el) => el != 'no-viewer'); 
      
      console.log('1 clients.length AFTER disconnect ' + arrayOfClientSockets1.length);
      console.log('1 viewerArray.length AFTER disconnect ' + arrayOfViewerSockets1.length);
      

    };

    const fnPlayerDisconnect = socket => {
      clients[clients.indexOf(socket)] = 'no-player';
      gameObject.gameField = ["","","","","","","","",""];
      io.emit('gameField', newGame.gameField); 
      io.emit('messagePlayerDisconnected');
      io.emit("messageWait");
      io.emit('emptyInfo2');
      io.emit('hide-start-button');      
      if (clients[0] == 'no-player' && clients[1] == 'no-player') clients = [];   
      let arrayOfClientSockets2 = clients.filter((el) => el != 'no-player');  
      let arrayOfViewerSockets2 = viewerArray.filter((el) => el != 'no-viewer'); 
     
      console.log('2 clients.length AFTER disconnect ' + arrayOfClientSockets2.length);
      console.log('2 viewerArray.length AFTER disconnect ' + arrayOfViewerSockets2.length);    
      addViewerToClients();
    };

    clients.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));



    const fnViewerDisconnect = socket => {       
      delete viewerArray[(viewerArray.indexOf(socket))];   
      let arrayOfClientSockets3 = clients.filter((el) => el != 'no-player');  
      let arrayOfViewerSockets3 = viewerArray.filter((el) => el != 'no-viewer'); 
      
      console.log('3 clients.length AFTER disconnect ' + arrayOfClientSockets3.length);
      console.log('3 viewerArray.length AFTER disconnect ' + arrayOfViewerSockets3.length);     
    };

    viewerArray.map(socket => socket.on('disconnect', () => fnViewerDisconnect(socket)));
     
      

      
   
});




webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);
});