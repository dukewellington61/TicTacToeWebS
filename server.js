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


function createRoom(socket) {  

  const obj = {
    player1: socket,

    userArray: () => {         

      let userArray = new Array(2);
    
      if (obj.player1) userArray[0] = obj.player1;
      if (obj.player2) userArray[1] = obj.player2;        
      
      return userArray
    },

    fn: () => {            

      const newGame = gameModule.Game();   
      
      const startPlayer = newGame.currentPlayer;
      const secondPlayer = newGame.secondPlayer;       

      if (obj.player1) {

        obj.player1backup = obj.player1;

        obj.player1.on('new-user', name => {
                              
            obj[obj.player1backup.id] = name;  
            obj.fn(); 
            if (obj.player1) obj.player1.emit('startPlayer', {startPlayer: startPlayer, name: obj[obj.player1.id]});   
            if (obj.player2) obj.player2.emit('secondPlayer', {startPlayer: startPlayer, name: obj[obj.player2.id]});
            if (obj.player2) obj.player2.emit('user-connected', obj[obj.player1.id]);
          
        });
      };
  
      if (obj.player2) {

        obj.player2backup = obj.player2;

        obj.player2.on('new-user', name => {
                   
            obj[obj.player2backup.id] = name;  
            obj.fn();    
            if (obj.player1) obj.player1.emit('startPlayer', {startPlayer: startPlayer, name: obj[obj.player1.id]});   
            if (obj.player2) obj.player2.emit('secondPlayer', {startPlayer: startPlayer, name: obj[obj.player2.id]});
            if (obj.player1) obj.player1.emit('user-connected', obj[obj.player2.id]);
        });
      };   

      obj.userArray().forEach( player => player.emit('enter-name-message'));  

      if (obj.player1 && !obj[obj.player1.id] || obj.player2 && !obj[obj.player2.id]) {        
        return;
      }

      else {        
    
        obj.userArray().forEach( player => player.emit("Am Zug: ...", startPlayer));
    
        if (!obj.player1 || !obj.player2) {
          obj.userArray().forEach( player => player.emit("messageWait"));           
          return;
        };

        obj.userArray().forEach( player => player.emit("messageStart"));
    
        if (obj.player1 != undefined && obj.player2 != undefined) {
          obj.userArray().forEach( player => player.on('newGame', () => {
            obj.player1backup.emit('enableClient');
            newGame.gameField = ["","","","","","","","",""];
            obj.userArray().forEach( player => player.emit('gameField', newGame.gameField));  
            obj.userArray().forEach( player => player.emit("messageStart"));            
            obj.userArray().forEach( player => player.emit("Am Zug: ...", startPlayer));
            obj.player1backup.emit('hide-start-button');         
            obj.userArray().forEach( player => player.emit('game-has-started'));         
          }));   
        };    
    
        if (obj.player1 && obj.player2) {     
          
          obj.player1.emit('show-start-button');
        
          obj.userArray().forEach( player => player.emit('disableClient'));         

          // console.log(`1. obj.player1: ${obj.player1} & obj.player2: ${obj.player2}`);
          // console.log(`1. userArray[0]: ${obj.userArray()[0]} & userArray[1]: ${obj.userArray()[1]}`);

          obj.player2backup = obj.player2;
                      
          obj.player1.on('move', (field) => {          
            const message = newGame.move(startPlayer, field);        
            obj.userArray().forEach( player => player.emit('gameField', newGame.gameField));   
            obj.userArray().forEach( player => player.emit('emptyInfo3'));
            // console.log(`2. obj.player1: ${obj.player1} & obj.player2: ${obj.player2} & obj.player2backup: ${obj.player2backup}`);
            // console.log(`2. userArray[0]: ${obj.userArray()[0]} & userArray[1]: ${obj.userArray()[1]}`);
            
            obj.player1.emit('disableClient');              
            obj.player2backup.emit('enableClient');        
    
            obj.userArray().forEach( player => player.emit("Am Zug: ...", secondPlayer));        
    
            if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
              obj.userArray().forEach( player => player.emit('endMessage',message));

              obj.userArray().forEach( player => player.emit('disableClient'));  

            };
            obj.userArray().forEach( player => player.emit('disableOccupiedFields', newGame.gameField));          
          });

          obj.player1backup = obj.player1;
          obj.player2backup = obj.player2;
    
          obj.player2.on('move', (field) => {          
            const message = newGame.move(secondPlayer, field);        
            obj.userArray().forEach( player => player.emit('gameField', newGame.gameField));              
            obj.userArray().forEach( player => player.emit('emptyInfo3'));

            // console.log(`1. obj.player1: ${obj.player1} & obj.player2: ${obj.player2} & obj.player2backup: ${obj.player2backup}`);
            // console.log(`1. userArray[0]: ${obj.userArray()[0]} & userArray[1]: ${obj.userArray()[1]}`);
            
            obj.player2backup.emit('disableClient');
            obj.player1backup.emit('enableClient');   

            // console.log(`2. obj.player1: ${obj.player1} & obj.player2: ${obj.player2} & obj.player2backup: ${obj.player2backup}`);
            // console.log(`2. userArray[0]: ${obj.userArray()[0]} & userArray[1]: ${obj.userArray()[1]}`);

            obj.userArray().forEach( player => player.emit("Am Zug: ...", startPlayer));        
    
            if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
              obj.userArray().forEach( player => player.emit('endMessage', message));     

              obj.userArray().forEach( player => player.emit('disableClient'));  

            };        
            obj.userArray().forEach( player => player.emit('disableOccupiedFields', newGame.gameField));          
          });
        };        
      
        obj.userArray().forEach( player => player.on('send-chat-message', data => obj.userArray().forEach( player => player.emit('chat-message', {message: data.message, name: obj[data.id], player: 'player1'}))));
      };  
    },
    
    fnPlayerDisconnect: id => {    

      console.log('fnPlayerDisconnect')
      
      if (obj.player1 && id === obj.player1.id) {
        delete obj[obj.player1.id];        
      };

      if (obj.player2 && id === obj.player2.id) {
        delete obj[obj.player2.id];       
      };

      // console.log(`obj.player1: ${obj.player1} & obj.player2: ${obj.player2}`)
              
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

let gameRoom = {};

io.on("connection", socket => {     

  socket.emit('push');
  socket.emit('hide-start-button');     


  const roomsAndPlayaz = () => {         

    if (!roomsArray[0] && !gameRoom.player1 && !gameRoom.player2) {          
      gameRoom = createRoom(socket);      
      roomsArray.push(gameRoom);         
      gameRoom.fn();       
      return;      
    };   

    for (let i = 0; i < roomsArray.length; i++) {      
   
      if (roomsArray[i].player1 && !roomsArray[i].player2) {        
        roomsArray[i].player2 = socket;             
        roomsArray[i].fn();  
        return;
      };
  
      if (!roomsArray[i].player1 && roomsArray[i].player2) {        
        roomsArray[i].player1 = socket;             
        roomsArray[i].fn();  
        return;
      };      
    };    
    
    if (roomsArray.every( room => room.player1 && room.player2)) {      
      gameRoom = createRoom(socket);      
      roomsArray.push(gameRoom);  
      gameRoom.fn();                         
      return;
    };
    
  };

  roomsAndPlayaz();  

  // console.log(
  //   `connect length: ${roomsArray.length} roomsArray[0]: ${roomsArray[0] ? roomsArray[0] : 'no have'} & roomsArray[1]: ${roomsArray[1] ? roomsArray[1] : 'no have'} & roomsArray[2]: ${roomsArray[2] ? roomsArray[2] : 'no have'}`
  // );

  if (roomsArray[0]) console.log(`connect roomsArray[0].player1: ${roomsArray[0].player1 ? roomsArray[0].player1 : 'no have'} & roomsArray[0].player2: ${roomsArray[0].player2 ? roomsArray[0].player2 : 'no have'}`);
  if (roomsArray[1]) console.log(`connect roomsArray[1].player1: ${roomsArray[1].player1 ? roomsArray[1].player1 : 'no have'} & roomsArray[1].player2: ${roomsArray[1].player2 ? roomsArray[1].player2 : 'no have'}`);
  if (roomsArray[2]) console.log(`connect roomsArray[2].player1: ${roomsArray[2].player1 ? roomsArray[2].player1 : 'no have'} & roomsArray[1].player2: ${roomsArray[2].player2 ? roomsArray[2].player2 : 'no have'}`);

  const playerDisconnect = id => {       
   
    for (let i = 0; i < roomsArray.length; i++) {      

      if (roomsArray[i].player1 && roomsArray[i].player1.id === id) {
        roomsArray[i].fnPlayerDisconnect(id);
        roomsArray[i].userArray(); 

        delete roomsArray[i].player1;  
        // console.log(roomsArray[i].player1);
         
        uniteLonelyPlayers();
        deleteEmptyRooms();   
      };

      if (roomsArray[i] && roomsArray[i].player2 && roomsArray[i].player2.id === id) {
        roomsArray[i].fnPlayerDisconnect(id);
        roomsArray[i].userArray();   

        delete roomsArray[i].player2;   
        // console.log(roomsArray[i].player2);
           
        uniteLonelyPlayers();
        deleteEmptyRooms();    
      };         
    };  

    if (roomsArray[0]) console.log(`Disconnect roomsArray[0].player1: ${roomsArray[0].player1 ? roomsArray[0].player1 : 'no have'} & roomsArray[0].player2: ${roomsArray[0].player2 ? roomsArray[0].player2 : 'no have'}`);
    if (roomsArray[1]) console.log(`Disconnect roomsArray[1].player1: ${roomsArray[1].player1 ? roomsArray[1].player1 : 'no have'} & roomsArray[1].player2: ${roomsArray[1].player2 ? roomsArray[1].player2 : 'no have'}`);
    if (roomsArray[2]) console.log(`Disconnect roomsArray[2].player1: ${roomsArray[2].player1 ? roomsArray[2].player1 : 'no have'} & roomsArray[1].player2: ${roomsArray[2].player2 ? roomsArray[2].player2 : 'no have'}`);       
        
    
  };

  let roomIndexArr = [];

  const uniteLonelyPlayers = () => {    
  
    for (let i = 0; i < roomsArray.length; i++) {      
      
      if (!roomsArray[i].player1 || !roomsArray[i].player2) {        
        roomIndexArr.push(i);            
        if (roomIndexArr.length > 2) return;
      };      
    };    

    if (roomIndexArr.length === 2) {

      // console.log(
      //   `uniteLonelyPlayers length: ${roomsArray.length} roomsArray[0] ${roomsArray[0] ? roomsArray[0] : 'no have'} & roomsArray[1] ${roomsArray[1] ? roomsArray[1] : 'no have'} & roomsArray[2] ${roomsArray[2] ? roomsArray[2] : 'no have'}`
      // ); 
      

      let room1Player1;
      let room1Player2;
      let room2Player1;
      let room2Player2;
    
      if (roomsArray[roomIndexArr[0]].player1) room1Player1 = roomsArray[roomIndexArr[0]].player1;
      if (roomsArray[roomIndexArr[0]].player2) room1Player2 = roomsArray[roomIndexArr[0]].player2;
      if (roomsArray[roomIndexArr[1]].player1) room2Player1 = roomsArray[roomIndexArr[1]].player1;
      if (roomsArray[roomIndexArr[1]].player2) room2Player2 = roomsArray[roomIndexArr[1]].player2;
    
    
      if (!room1Player1 && room2Player1) {        
        roomsArray[roomIndexArr[0]].player1 = roomsArray[roomIndexArr[1]].player1;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player1.id];        
        roomsArray[roomIndexArr[0]].fn(); 
        delete roomsArray[roomIndexArr[1]].player1;        
      };

      if (!room1Player1 && room2Player2) {        
        roomsArray[roomIndexArr[0]].player1 = roomsArray[roomIndexArr[1]].player2;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player2.id];
        roomsArray[roomIndexArr[0]].fn();
        delete roomsArray[roomIndexArr[1]].player2;        
      };
    
      if (!room1Player2 && room2Player1) {        
        roomsArray[roomIndexArr[0]].player2 = roomsArray[roomIndexArr[1]].player1;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player1.id];
        roomsArray[roomIndexArr[0]].fn();
        delete roomsArray[roomIndexArr[1]].player1;       
        console.log('player 1: ' + roomsArray[roomIndexArr[0]].player1);
        console.log('player 2: ' + roomsArray[roomIndexArr[0]].player2);
      };

      if (!room1Player2 && room2Player2) {        
        roomsArray[roomIndexArr[0]].player2 = roomsArray[roomIndexArr[1]].player2;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player2.id];
        roomsArray[roomIndexArr[0]].fn();
        delete roomsArray[roomIndexArr[1]].player2;       
      };

      deleteEmptyRooms();     
    
    };    
  };

  const deleteEmptyRooms = () => {

    for (let i = 0; i < roomsArray.length; i++) {        
  
      if (!roomsArray[i].player1 && !roomsArray[i].player2) {         
        roomsArray = roomsArray.filter(el => el != roomsArray[i]);    
      };
    };
  };
  

  socket.on('idle-socket-disconnect', () => playerDisconnect(socket.id));
  socket.on('disconnect', () => playerDisconnect(socket.id));
  
});

webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);

});