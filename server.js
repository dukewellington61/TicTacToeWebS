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


function GameRoom(socket) {  
  this.player1 = socket
};
  

GameRoom.prototype.userArray = function (index) {
  let gameRoom = roomsArray[index];
  let userArray = new Array(2);
    
  if (gameRoom.player1) userArray[0] = gameRoom.player1;
  if (gameRoom.player2) userArray[1] = gameRoom.player2;        
      
  return userArray;
};
    

GameRoom.prototype.fn = function (index) {         

  let gameRoom = roomsArray[index];

  const newGame = gameModule.Game();   

  const startPlayer = newGame.currentPlayer;
  const secondPlayer = newGame.secondPlayer;      

  if (gameRoom.player1) {    

    gameRoom.player1.on('new-user', name => {
                 
      gameRoom[gameRoom.player1.id] = name;  
      gameRoom.fn(index); 
        if (gameRoom.player1) gameRoom.player1.emit('start-player', {startPlayer: startPlayer, name: gameRoom[gameRoom.player1.id]});   
        if (gameRoom.player2) gameRoom.player2.emit('second-player', {startPlayer: startPlayer, name: gameRoom[gameRoom.player2.id]});
        if (gameRoom.player1 && gameRoom.player2) gameRoom.player1.emit('user-connected', gameRoom[gameRoom.player2.id]);
        if (gameRoom.player2) gameRoom.player2.emit('user-connected', gameRoom[gameRoom.player1.id]);          
    });
  };

  if (gameRoom.player2) {  

    gameRoom.player2.on('new-user', name => {
                
      gameRoom[gameRoom.player2.id] = name;  
        gameRoom.fn(index);    
        if (gameRoom.player1) gameRoom.player1.emit('start-player', {startPlayer: startPlayer, name: gameRoom[gameRoom.player1.id]});   
        if (gameRoom.player2) gameRoom.player2.emit('second-player', {startPlayer: startPlayer, name: gameRoom[gameRoom.player2.id]});
        if (gameRoom.player1) gameRoom.player1.emit('user-connected', gameRoom[gameRoom.player2.id]);
        if (gameRoom.player2) gameRoom.player2.emit('user-connected', gameRoom[gameRoom.player1.id]);      
    });
  };   

  gameRoom.userArray(index).forEach( player => player.emit('enter-name-message'));  

  if (gameRoom.player1 && !gameRoom[gameRoom.player1.id] || gameRoom.player2 && !gameRoom[gameRoom.player2.id]) {        
    return;
  }

  else {           

    if (!gameRoom.player1 || !gameRoom.player2) {
      gameRoom.userArray(index).forEach( player => player.emit("message-wait"));           
      return;
    };

    gameRoom.userArray(index).forEach( player => player.emit("message-start"));

    if (gameRoom.player1 != undefined && gameRoom.player2 != undefined) {
      gameRoom.userArray(index).forEach( player => player.on('new-game', () => {
        gameRoom.player1.emit('enable-client');
        newGame.gameField = ["","","","","","","","",""];
        gameRoom.userArray(index).forEach( player => player.emit('game-field', newGame.gameField));  
        gameRoom.userArray(index).forEach( player => player.emit("message-start"));            
        gameRoom.player1.emit('to-move', {moveMessage: `Your turn, ${gameRoom[gameRoom.player1.id]}`});
        gameRoom.player2.emit('to-move', {moveMessage: `${gameRoom[gameRoom.player1.id]}'s turn`});
        gameRoom.player1.emit('hide-start-button');         
        gameRoom.userArray(index).forEach( player => player.emit('game-has-started'));         
      }));   
    };    

    if (gameRoom.player1 && gameRoom.player2) {     
      
      gameRoom.player1.emit('show-start-button');
    
      gameRoom.userArray(index).forEach( player => player.emit('disable-client'));      
      
      gameRoom.player2backup = gameRoom.player2;
                  
      gameRoom.player1.on('move', (field) => {          
        const message = newGame.move(startPlayer, field);        
        gameRoom.userArray(index).forEach( player => player.emit('game-field', newGame.gameField));   
        gameRoom.userArray(index).forEach( player => player.emit('empty-info3'));            
        
        gameRoom.player1backup.emit('disable-client');              
        gameRoom.player2backup.emit('enable-client');        

        if (gameRoom.player2) gameRoom.player2.emit('to-move', {moveMessage: `Your turn, ${gameRoom[gameRoom.player2.id]}`});
        if (gameRoom.player1) gameRoom.player1.emit('to-move', {moveMessage: `${gameRoom[gameRoom.player2.id]}'s turn`});     

        if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
          
          if (startPlayer === 'X' && message === 'Game Over: Player X has won!') {
            gameRoom.player1.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player2.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player1.id]} is the winner.`});
          };

          if (startPlayer === 'O' && message === 'Game Over: Player O has won!') {
            gameRoom.player1.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player2.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player1.id]} is the winner.`});
          };

          if (secondPlayer === 'X' && message === 'Game Over: Player X has won!') {
            gameRoom.player2.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player1.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player1.id]} is the winner.`});
          };

          if (secondPlayer === 'O' && message === 'Game Over: Player O has won!') {
            gameRoom.player2.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player1.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player1.id]} is the winner.`});
          };

          if (message === "It's a draw.") gameRoom.userArray(index).forEach( player => player.emit('end-message', {winMessage: "It's a draw."}));              

          gameRoom.userArray(index).forEach( player => player.emit('disable-client'));  

          gameRoom.player1.emit('show-start-button');

        };
        gameRoom.userArray(index).forEach( player => player.emit('disable-occupied-fields', newGame.gameField));          
      });

      gameRoom.player1backup = gameRoom.player1;
      gameRoom.player2backup = gameRoom.player2;

      gameRoom.player2.on('move', (field) => {          
        const message = newGame.move(secondPlayer, field);        
        gameRoom.userArray(index).forEach( player => player.emit('game-field', newGame.gameField));              
        gameRoom.userArray(index).forEach( player => player.emit('empty-info3'));          
        
        gameRoom.player2backup.emit('disable-client');
        gameRoom.player1backup.emit('enable-client');   

        if (gameRoom.player1) gameRoom.player1.emit('to-move', {moveMessage: `Your turn, ${gameRoom[gameRoom.player1.id]}`});
        if (gameRoom.player2) gameRoom.player2.emit('to-move', {moveMessage: `${gameRoom[gameRoom.player1.id]}'s turn`});     

        if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
          
          if (startPlayer === 'X' && message === 'Game Over: Player X has won!') {
            gameRoom.player1.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player2.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player1.id]} is the winner.`});
          };

          if (startPlayer === 'O' && message === 'Game Over: Player O has won!') {
            gameRoom.player1.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player2.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player1.id]} is the winner.`});
          };

          if (secondPlayer === 'X' && message === 'Game Over: Player X has won!') {
            gameRoom.player2.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player1.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player2.id]} is the winner.`});
          };

          if (secondPlayer === 'O' && message === 'Game Over: Player O has won!') {
            gameRoom.player2.emit('end-message', {winMessage: `Congratulations! You've won!`});
            gameRoom.player1.emit('end-message', {winMessage: `You've lost. ${gameRoom[gameRoom.player2.id]} is the winner.`});
          };

          if (message === "It's a draw.") gameRoom.userArray(index).forEach( player => player.emit('end-message', {winMessage: "It's a draw."}));   
          

          gameRoom.userArray(index).forEach( player => player.emit('disable-client'));  

        };        
        gameRoom.userArray(index).forEach( player => player.emit('disable-occupied-fields', newGame.gameField));          
      });
    };        

    gameRoom.userArray(index).forEach( player => player.on('send-chat-message', data => gameRoom.userArray(index).forEach( player => player.emit('chat-message', {message: data.message, name: gameRoom[data.id], player: 'player1'}))));
  };  
};
    
GameRoom.prototype.fnPlayerDisconnect = function (id) {        
              
  gameModule.Game().gameField = ["","","","","","","","",""];
  gameRoom.userArray().forEach( player => player.emit('game-field', gameModule.Game().gameField)); 
  if (gameRoom.player1 && gameRoom.player2) gameRoom.player1.emit('message-player-disconnected', gameRoom[gameRoom.player2backup.id]);
  if (gameRoom.player2) gameRoom.player2.emit('message-player-disconnected', gameRoom[gameRoom.player1backup.id]);     
  gameRoom.userArray().forEach( player => player.emit("message-wait"));
  gameRoom.userArray().forEach( player => player.emit('empty-info2'));
  gameRoom.userArray().forEach( player => player.emit('hide-start-button'));      
  if (!gameRoom.player1 && !gameRoom.player2) gameRoom.userArray() = [];     
};
  



let roomsArray = [];

io.on("connection", socket => {     

  socket.emit('push');
  socket.emit('hide-start-button');      

  const roomsAndPlayaz = () => {        

    if (!roomsArray[0]) {          
      roomsArray.push(new GameRoom(socket));      
      roomsArray[0].fn(0);  
      return;      
    };   

    for (let i = 0; i < roomsArray.length; i++) {      
   
      if (roomsArray[i].player1 && !roomsArray[i].player2) {        
        roomsArray[i].player2 = socket;             
        roomsArray[i].fn(i);
        return;
      };
  
      if (!roomsArray[i].player1 && roomsArray[i].player2) {        
        roomsArray[i].player1 = socket;             
        roomsArray[i].fn(i);  
        return;
      };      
    };    
    
    if (roomsArray.every( room => room.player1 && room.player2)) {      
      roomsArray.push(new GameRoom(socket));
      roomsArray[roomsArray.length - 1].fn(roomsArray.length - 1);                         
      return;
    };

    console.log(roomsArray[0]);
    
  };

  roomsAndPlayaz();    

  if (roomsArray[0]) console.log(`connect roomsArray[0].player1: ${roomsArray[0].player1 ? roomsArray[0].player1 : 'no have'} & roomsArray[0].player2: ${roomsArray[0].player2 ? roomsArray[0].player2 : 'no have'}`);
  if (roomsArray[1]) console.log(`connect roomsArray[1].player1: ${roomsArray[1].player1 ? roomsArray[1].player1 : 'no have'} & roomsArray[1].player2: ${roomsArray[1].player2 ? roomsArray[1].player2 : 'no have'}`);
  if (roomsArray[2]) console.log(`connect roomsArray[2].player1: ${roomsArray[2].player1 ? roomsArray[2].player1 : 'no have'} & roomsArray[1].player2: ${roomsArray[2].player2 ? roomsArray[2].player2 : 'no have'}`);

  const playerDisconnect = id => {       
   
    for (let i = 0; i < roomsArray.length; i++) {      

      if (roomsArray[i].player1 && roomsArray[i].player1.id === id) {
        roomsArray[i].player1.fnPlayerDisconnect;
        roomsArray[i].player1.userArray; 

        delete roomsArray[i].player1;          
         
        uniteLonelyPlayers();
        deleteEmptyRooms();   
      };

      if (roomsArray[i] && roomsArray[i].player2 && roomsArray[i].player2.id === id) {
        roomsArray[i].player2.fnPlayerDisconnect;
        roomsArray[i].player2.userArray;   

        delete roomsArray[i].player2;        
           
        uniteLonelyPlayers();
        deleteEmptyRooms();    
      };         
    };  

    if (!roomsArray[0] && !roomsArray[1] && !roomsArray[2]) console.log('no rooms');
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
        roomsArray[roomIndexArr[0]].player2.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id]);
        roomsArray[roomIndexArr[0]].player1.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id]);        
      };

      if (!room1Player1 && room2Player2) {        
        roomsArray[roomIndexArr[0]].player1 = roomsArray[roomIndexArr[1]].player2;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player2.id];
        roomsArray[roomIndexArr[0]].fn();
        delete roomsArray[roomIndexArr[1]].player2;    
        roomsArray[roomIndexArr[0]].player2.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id]);
        roomsArray[roomIndexArr[0]].player1.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id]);    
      };
    
      if (!room1Player2 && room2Player1) {        
        roomsArray[roomIndexArr[0]].player2 = roomsArray[roomIndexArr[1]].player1;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player1.id];
        roomsArray[roomIndexArr[0]].fn();
        delete roomsArray[roomIndexArr[1]].player1;    
        roomsArray[roomIndexArr[0]].player2.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id]);
        roomsArray[roomIndexArr[0]].player1.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id]);       
      };

      if (!room1Player2 && room2Player2) {        
        roomsArray[roomIndexArr[0]].player2 = roomsArray[roomIndexArr[1]].player2;
        roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id] = roomsArray[roomIndexArr[1]][roomsArray[roomIndexArr[1]].player2.id];
        roomsArray[roomIndexArr[0]].fn();
        delete roomsArray[roomIndexArr[1]].player2;   
        roomsArray[roomIndexArr[0]].player2.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player1.id]);
        roomsArray[roomIndexArr[0]].player1.emit('user-connected', roomsArray[roomIndexArr[0]][roomsArray[roomIndexArr[0]].player2.id]);    
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