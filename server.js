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


  

let client0ID = {};

let client1ID = {};


let viewerArray = [];

let gamesArray =[];



function createRoom(socket) {  

  const obj = {
    player1: socket,

    userArray: () => {

      let userArray = new Array(2);
    
      if (obj.player1) userArray[0] = obj.player1;
      if (obj.player2) userArray[1] = obj.player2;  

      console.log('44: ' + userArray);
      
      return userArray
    },

    fn: () => {     

      const playerTimedOut = {};           

      const newGame = gameModule.Game();
      gamesArray.push(newGame);

      const startPlayer = newGame.currentPlayer;
      const secondPlayer = newGame.secondPlayer;     
      
      const fnPlayerTimedOut = id => {          

        if (obj.player1 && id == obj.player1.id) playerTimedOut.player1 = true;         

        if (obj.player2 && id == obj.player2.id) playerTimedOut.player2 = true;
      
      };
      
      if (playerTimedOut.player1 === true || playerTimedOut.player2 === true) return;

      else {

        if (obj.player1) obj.player1.emit('startPlayer', startPlayer);
    
        if (obj.player2) obj.player2.emit('secondPlayer', startPlayer);
    
        obj.userArray().forEach( player => player.emit("Am Zug: ...", startPlayer));
    
        if (!obj.player1 || !obj.player2) {
          obj.userArray().forEach( player => player.emit("messageWait")); 
          return;
        };

        obj.userArray().forEach( player => player.emit("messageStart"));
    
        if (obj.player1 != undefined && obj.player2 != undefined) {
          obj.userArray().forEach( player => player.on('newGame', () => {
            obj.player1.emit('enableClient0');
            newGame.gameField = ["","","","","","","","",""];
            obj.userArray().forEach( player => player.emit('gameField', newGame.gameField));  
            obj.userArray().forEach( player => player.emit("messageStart"));
            obj.player1.emit('startPlayer',startPlayer);
            obj.player2.emit('secondPlayer',startPlayer);
            obj.userArray().forEach( player => player.emit("Am Zug: ...", startPlayer));
            obj.player1.emit('hide-start-button');         
            obj.userArray().forEach( player => player.emit('game-has-started'));         
          }));   
        };
    
        if (obj.player1 && obj.player2) {     
    
          obj.player1.emit('show-start-button');
        
          obj.player1.emit('disableClient0');
          obj.player2.emit('disableClient1');
                      
          obj.player1.on('move', (field) => {          
            const message = newGame.move(startPlayer, field);        
            obj.userArray().forEach( player => player.emit('gameField', newGame.gameField));   
            obj.userArray().forEach( player => player.emit('emptyInfo3'));
            
            obj.player1.emit('disableClient0');
            obj.player2.emit('enableClient1');        
    
            obj.userArray().forEach( player => player.emit("Am Zug: ...", secondPlayer));        
    
            if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
              obj.userArray().forEach( player => player.emit('endMessage',message));
              obj.player1.emit('disableClient0');
              obj.player2.emit('disableClient1');
            };
            obj.userArray().forEach( player => player.emit('disableOccupiedFields', newGame.gameField));          
          });
    
          obj.player2.on('move', (field) => {          
            const message = newGame.move(secondPlayer, field);        
            obj.userArray().forEach( player => player.emit('gameField', newGame.gameField));   
            
            obj.userArray().forEach( player => player.emit('emptyInfo3'));
            
            obj.player2.emit('disableClient1');
            obj.player1.emit('enableClient0');     
            obj.userArray().forEach( player => player.emit("Am Zug: ...", startPlayer));        
    
            if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
              obj.userArray().forEach( player => player.emit('endMessage',message));     
              obj.player1.emit('disableClient0');
              obj.player2.emit('disableClient1');
            };        
            obj.userArray().forEach( player => player.emit('disableOccupiedFields', newGame.gameField));          
          });
        };     
      };

      if (obj.player1) {
        obj.player1.on('new-user', name => {
          if (obj.player1 && !users[obj.player1.id]) {
            // console.log('conditional 1 ' + name);         
            users[obj.player1.id] = name;
            // console.log(users);
            return;
          };
        });
      };
  
      if (obj.player2) {
        obj.player2.on('new-user', name => {
          if (obj.player2 && users[obj.player1.id]) {
            // console.log('conditional 2 ' + name);         
            users[obj.player2.id] = name;
            // console.log(users);
            return;
          };
        });
      };   
      
      obj.userArray().forEach( player => player.on('send-chat-message', data => obj.userArray().forEach( player => player.emit('chat-message', {message: data.message, name: users[data.id], player: 'player1'}))));
    },
    
    fnPlayerDisconnect: id => {    
      
      console.log('line 170: ' + id);
      if (obj.player1) console.log('line 171: ' + obj.player1.id);
      if (obj.player2) console.log('line 172: ' + obj.player2.id);
        
      if (obj.player1 && id == obj.player1.id) {   
        obj.userArray();      
        // delete obj.userArray()[0];
        console.log('line 176: ' + obj.userArray());            
      };          

      if (obj.player2 && id == obj.player2.id) {   
        obj.userArray();       
        // delete obj.userArray()[1];    
        console.log('line 181: ' + obj.userArray());            
      };
              
      gameModule.Game().gameField = ["","","","","","","","",""];
      obj.userArray().forEach( player => player.emit('gameField', gameModule.Game().gameField)); 
      obj.userArray().forEach( player => player.emit('messagePlayerDisconnected'));
      obj.userArray().forEach( player => player.emit("messageWait"));
      obj.userArray().forEach( player => player.emit('emptyInfo2'));
      obj.userArray().forEach( player => player.emit('hide-start-button'));      
      if (!obj.player1 && !obj.player2) obj.userArray() = [];        
    }    
  };
  return obj;
};


let roomsArray = [];

let users = {};

let gameRoom = {};

io.on("connection", socket => {     

 

  socket.emit('push');
  socket.emit('hide-start-button');     


  const roomsAndPlayaz = () => {         

    if (!gameRoom.player1 && !gameRoom.player2) {    
      // console.log('conditional 1');
      gameRoom = createRoom(socket);      
      roomsArray.push(gameRoom);         
      gameRoom.fn();   
    
      return;      
    };   
        
    if (gameRoom.player1 && gameRoom.player2) {   
      // console.log('conditional 2'); 
      gameRoom = createRoom(socket);      
      roomsArray.push(gameRoom);  
      gameRoom.fn();
                         
      return;
    };   
    
    if (gameRoom.player1 && !gameRoom.player2) {
      // console.log('conditional 3'); 
      gameRoom.player2 = socket;             
      gameRoom.fn();    
     
      return;      
    };  

    if (!gameRoom.player1 && gameRoom.player2) {
      // console.log('conditional 4'); 
      gameRoom.player1 = socket;             
      gameRoom.fn();  
          
      return;      
    };  
  };

  roomsAndPlayaz();  

  const playerDisconnect = id => {     
   
    for (let i = 0; i < roomsArray.length; i++) {

      // if (roomsArray[i].player1) console.log(roomsArray[i].player1.id);
      // if (roomsArray[i].player2) console.log(roomsArray[i].player2.id);

      // console.log('line 256' + roomsArray[i].player1);
      // console.log('line 257' + roomsArray[i].player2);

      if (roomsArray[i].player1 && roomsArray[i].player1.id === id) {
        roomsArray[i].fnPlayerDisconnect(id);
        delete roomsArray[i].player1;        
      };

      if (roomsArray[i].player2 && roomsArray[i].player2.id === id) {
        roomsArray[i].fnPlayerDisconnect(id);
        delete roomsArray[i].player2;        
      };

      // console.log('line 262' + roomsArray[i].player1);    
      // console.log('line 263' + roomsArray[i].player2);    
    };
  };

  socket.on('idle-socket-disconnect', () => playerDisconnect(socket.id));
  socket.on('disconnect', () => playerDisconnect(socket.id));



  
  
  

  
  

  

  

  
});

webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);

});