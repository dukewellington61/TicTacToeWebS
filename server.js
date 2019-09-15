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
    fn: () => {         

      let arr = new Array(2);
      // let arr = [];

      if (obj.player1) arr[0] = obj.player1;
      if (obj.player2) arr[1] = obj.player2;    
      
      // if (obj.player1 != undefined) arr.push(obj.player1);
      // if (obj.player2 != undefined) arr.push(obj.player2);     
      
      // console.log('arr: ' + arr);
      // console.log('obj.player1: ' + obj.player1);
      // console.log('obj.player2: ' + obj.player2);

      const newGame = gameModule.Game();
      gamesArray.push(newGame);

      const startPlayer = newGame.currentPlayer;
      const secondPlayer = newGame.secondPlayer;       
  
      if (obj.player1) obj.player1.emit('startPlayer', startPlayer);
  
      if (obj.player2) obj.player2.emit('secondPlayer', startPlayer);
  
      arr.forEach( player => player.emit("Am Zug: ...", startPlayer));
  
      if (arr.length == 1) socket.emit("messageWait");
      arr.forEach( player => player.emit("messageStart"));
  
      if (obj.player1 != undefined && obj.player2 != undefined) {
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


      const userTimeOut = id => {      

        // console.log('userTimeOut');                 
        
        if (obj.player1 && id == obj.player1.id) {  
          // console.log('conditional 1');           
          delete arr[0];
          delete obj.player1;
          // console.log(obj.player1);  
          return
        };

        if (obj.player2 && id == obj.player2.id) {  
          // console.log('conditional 2');        
          delete arr[1];
          delete obj.player2;
          // console.log(obj.player2);
        };         
      };        

      arr.forEach( player => player.on('socket-timeout', id => userTimeOut(id))); 
      
    
      const fnPlayerDisconnect = socket => {
        if (obj.player1 && socket.id == obj.player1.id) delete obj.player1;
        if (obj.player2 && socket.id == obj.player2.id) delete obj.player2;
        delete arr[arr.indexOf(socket)];        
        newGame.gameField = ["","","","","","","","",""];
        arr.forEach( player => player.emit('gameField', newGame.gameField)); 
        arr.forEach( player => player.emit('messagePlayerDisconnected'));
        arr.forEach( player => player.emit("messageWait"));
        arr.forEach( player => player.emit('emptyInfo2'));
        arr.forEach( player => player.emit('hide-start-button'));      
        if (!obj.player1 && !obj.player2) arr = [];     
        
        // console.log('2 after CLIENTS array: ' + arr + arr.length);
        
        
        socket.id === client0ID ? delete client0ID.id : delete client1ID.id;         
        
        obj.fn();
    
        arr.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));
      };
    
    
      arr.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));   
      
    

      /* messenger stuff */   

      
      
             
         
        socket.on('new-user', name => {    
          if (obj.player1 && socket.id == obj.player1.id) users[obj.player1.id] = name;
          if (obj.player2 && socket.id == obj.player2.id) users[obj.player2.id] = name;
          socket.broadcast.emit('user-connected', name);  
          console.log(users);
        
      
          
        arr.forEach ( player => player.on('send-chat-message', message => arr.forEach( player => player.emit('chat-message', {message: message, name: users[socket.id]}))));  

      });

      
    
      /* end of messenger stuff */    
    }    
    
  };
  return obj;
};


let roomsArray = [];

let users = {};

let gameRoom = {};

io.on("connection", socket => {     

  socket.on('new-user', name => {    
    users[socket.id] = name;
    socket.broadcast.emit('user-connected', name);  
    console.log(users);
  });
      
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

  
  


  

  

  
});

webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);

});