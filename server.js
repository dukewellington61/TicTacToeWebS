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
  
      if (!obj.player1 || !obj.player2) socket.emit("messageWait");
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


      // const userTimeOut = id => {      

      //   console.log('before player1: ' + obj.player1);   
      //   console.log('before player2: ' + obj.player2);               
        
      //   if (obj.player1 && id == obj.player1.id) {  
      //     // console.log('conditional 1');           
      //     delete arr[0];
      //     delete obj.player1;
      //     console.log('player 1: ' + obj.player1);
      //     return
      //   };

      //   if (obj.player2 && id == obj.player2.id) {  
      //     // console.log('conditional 2');        
      //     delete arr[1];
      //     delete obj.player2;
      //     console.log('player 2: ' + obj.player2);
      //   };         
      // };        
      
      
    
      const fnPlayerDisconnect = id => {
        // console.log('fnPlayerDisconnect');

        // console.log('before player1: ' + obj.player1);   
        // console.log('before player2: ' + obj.player2);    

        if (obj.player1 && id == obj.player1.id) {
          delete obj.player1;
          delete arr[0];
          if (obj.player2) {
            console.log('test1');
            // obj.player2.emit('messagePlayerDisconnected');
            // obj.player2.emit('messageWait');
            // obj.player2.emit('emptyInfo2');
          };          
          // console.log('player 1: ' + obj.player1);
        };

        if (obj.player2 && id == obj.player2.id) {
          delete obj.player2;
          delete arr[1];
          if (obj.player1) {
            console.log('test2');
            // obj.player1.emit('messagePlayerDisconnected');
            // obj.player1.emit('messageWait');
            // obj.player1.emit('emptyInfo2');
          };
          // console.log('player 2: ' + obj.player2);
        };
                
        newGame.gameField = ["","","","","","","","",""];
        arr.forEach( player => player.emit('gameField', newGame.gameField)); 
        arr.forEach( player => player.emit('messagePlayerDisconnected'));
        arr.forEach( player => player.emit("messageWait"));
        arr.forEach( player => player.emit('emptyInfo2'));
        arr.forEach( player => player.emit('hide-start-button'));      
        if (!obj.player1 && !obj.player2) arr = [];     
        
        // console.log('2 after CLIENTS array: ' + arr + arr.length);
        
        
        socket.id === client0ID ? delete client0ID.id : delete client1ID.id;         
        
        // obj.fn();
    
        // arr.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket.id)));
      };
    
    
      arr.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket.id)));  

      /* TIME OUT FUNCTION CALL - do not delete! */
      arr.forEach( player => player.on('socket-timeout', id => fnPlayerDisconnect(id))); 

         

      if (obj.player1) {
        obj.player1.on('new-user', name => {
          if (obj.player1 && !users[obj.player1.id]) {
            console.log('conditional 1 ' + name);         
            users[obj.player1.id] = name;
            console.log(users);
            return;
          };
        });
      };

      if (obj.player2) {
        obj.player2.on('new-user', name => {
          if (obj.player2 && users[obj.player1.id]) {
              console.log('conditional 2 ' + name);         
              users[obj.player2.id] = name;
              console.log(users);
              return;
          };
        });
      };   

      arr.forEach( player => player.on('send-chat-message', data => arr.forEach( player => player.emit('chat-message', {message: data.message, name: users[data.id], player: 'player1'}))));
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

 
  


  

  

  
});

webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);

});