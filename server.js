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

const gameModule = require("./GameModule.js");

const users = {};

let client0ID = {};

let client1ID = {};


let viewerArray = [];

let gamesArray =[];

function createRoom(socket) {

  const obj = {
    player1: socket,
    fn: () => {  

      let arr = [];

      arr.push(obj.player1);
      if (obj.player2 != undefined) arr.push(obj.player2);      

      const newGame = gameModule.Game();
      gamesArray.push(newGame);

      const startPlayer = newGame.currentPlayer;
      const secondPlayer = newGame.secondPlayer;       
  
      if (obj.player1) obj.player1.emit('startPlayer', startPlayer);
  
      if (obj.player2) obj.player2.emit('secondPlayer', startPlayer);
  
      arr.forEach( player => player.emit("Am Zug: ...", startPlayer));
  
      if (arr.length == 1) socket.emit("messageWait");
      arr.forEach( player => player.emit("messageStart"));
  
      if (obj.player1 && obj.player2) {
        arr.forEach( player => player.on('newGame', () => {
          obj.player1.emit('enableClient0');
          newGame.gameField = ["","","","","","","","",""];
          arr.forEach( player => player.emit('gameField', newGame.gameField));  
          arr.forEach( player => player.emit("messageStart"));
          obj.player1.emit('startPlayer',startPlayer);
          obj.player2.emit('secondPlayer',startPlayer);
          arr.forEach( player => player.emit("Am Zug: ...", startPlayer));
          obj.player1.emit('hide-start-button');         
          arr.forEach( player => player.emit('game-has-started'));         
        }));   
      };
  
      if (obj.player1 && obj.player2) {     
  
        obj.player1.emit('show-start-button');
      
        obj.player1.emit('disableClient0');
        obj.player2.emit('disableClient1');
                    
        obj.player1.on('move', (field) => {
          const message = newGame.move(startPlayer, field);        
          arr.forEach( player => player.emit('gameField', newGame.gameField));   
          arr.forEach( player => player.emit('emptyInfo3'));
          
          obj.player1.emit('disableClient0');
          obj.player2.emit('enableClient1');        
  
          arr.forEach( player => player.emit("Am Zug: ...", secondPlayer));        
  
          if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
            arr.forEach( player => player.emit('endMessage',message));
            obj.player1.emit('disableClient0');
            obj.player2.emit('disableClient1');
          };
          arr.forEach( player => player.emit('disableOccupiedFields', newGame.gameField));          
        });
  
        obj.player2.on('move', (field) => {
          const message = newGame.move(secondPlayer, field);        
          arr.forEach( player => player.emit('gameField', newGame.gameField));   
          
          arr.forEach( player => player.emit('emptyInfo3'));
          
          obj.player2.emit('disableClient1');
          obj.player1.emit('enableClient0');   
          arr.forEach( player => player.emit("Am Zug: ...", startPlayer));        
  
          if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
            arr.forEach( player => player.emit('endMessage',message));     
            obj.player1.emit('disableClient0');
            obj.player2.emit('disableClient1');
          };        
          arr.forEach( player => player.emit('disableOccupiedFields', newGame.gameField));          
        });
      };   
      /* messenger stuff */
      socket.on('new-user', name => {    
        users[socket.id] = name;
        socket.broadcast.emit('user-connected', name);    
      });  

      socket.on('send-chat-message', message => arr.forEach( player => player.emit('chat-message', {message: message, name: users[socket.id]})));  
      /* end of messenger stuff */    
    }
    
  }
  return obj;
}

// function Room (socket) {
//   this.player1 = socket
// }

let roomsArray = [];

let gameRoom = {};

io.on("connection", socket => {    
      
  socket.emit('push');
  socket.emit('hide-start-button');    

  const roomsAndPlayaz = () => {      

    if (roomsArray.length === 0) {    
      gameRoom = createRoom(socket);      
      roomsArray.push(gameRoom);       
      console.log('conditional 1');    
      gameRoom.fn();     
      return;
    };   

    if (roomsArray.every( el => el.player1 != undefined) && roomsArray.every( el => el.player2 != undefined)) {    
      gameRoom = createRoom(socket);      
      roomsArray.push(gameRoom);   
      console.log('conditional 2');           
      return;
    };   
    
    if (roomsArray.some( el => el.player2 == undefined)) {
      gameRoom.player2 = socket;   
      console.log('conditional 3');      
      gameRoom.fn(); 
      return;      
    };  
  };

  roomsAndPlayaz();  

  
  


  

  

  // const addViewerToClients = () => {    
  //   if (viewerArray[0]) {      
  //     if (newRoom.player1 == undefined) {
  //       newRoom.player1 = viewerArray[0];        
  //     };

  //     if (newRoom.player2 == undefined) {
  //       newRoom.player2 = viewerArray[0];       
  //     };    

  //     removeViewerFromArray();
  //     newRoom.player1.emit('page-refresh'); 
  //     if (newRoom.player2) delete newRoom.player1;       
      
  //     fn();
  //     console.log('1 after CLIENTS array: ' + clients + clients.length);
  //     console.log('1 after VIEWERS array: ' + viewerArray + viewerArray.length);   
  //   };                   
  // };   

  // const removeViewerFromArray = () => viewerArray.shift();

  // const fnPlayerDisconnect = socket => {
  //   delete clients[clients.indexOf(socket)];        
  //   gameObject.gameField = ["","","","","","","","",""];
  //   for (var key in newRoom) newRoom[key].emit('gameField', newGame.gameField); 
  //   for (var key in newRoom) newRoom[key].emit('messagePlayerDisconnected');
  //   for (var key in newRoom) newRoom[key].emit("messageWait");
  //   for (var key in newRoom) newRoom[key].emit('emptyInfo2');
  //   for (var key in newRoom) newRoom[key].emit('hide-start-button');      
  //   if (!newRoom.player1 && !newRoom.player2) clients = [];     
    
  //   console.log('2 after CLIENTS array: ' + clients + clients.length);
  //   console.log('2 after VIEWERS array: ' + viewerArray + viewerArray.length);    
    
  //   socket.id === client0ID ? delete client0ID.id : delete client1ID.id;   

  //   setTimeout( () => !client0ID.id ? addViewerToClients() : undefined, 300);

  //   setTimeout( () => !client1ID.id ? addViewerToClients() : undefined, 300);   
    
  //   fn();

  //   clients.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));
  // };


  // clients.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));

  // const fnViewerDisconnect = socket => {   
  //   let disconnectedSocket = viewerArray[viewerArray.indexOf(socket)];       
  //   let FilterViewerArray = viewerArray.filter(el => el != disconnectedSocket);
  //   viewerArray = FilterViewerArray;
    
  //   console.log('3 after CLIENTS array: ' + clients + clients.length);
  //   console.log('3 after VIEWERS array: ' + viewerArray + viewerArray.length);
  //   fn();
  //   viewerArray.map(socket => socket.on('disconnect', () => fnViewerDisconnect(socket)));
  // };

  // viewerArray.map(socket => socket.on('disconnect', () => fnViewerDisconnect(socket)));   
});

webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);

});