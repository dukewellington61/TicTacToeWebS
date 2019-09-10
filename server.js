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

// app.get("/hello-world", (req, res) => {
//   res.send("Hello World");
// });

const gameModule = require("./GameModule.js");

const users = {};

let client0ID = {};

let client1ID = {};

let clients = [];

let viewerArray = [];

const newGame = new gameModule.Game();

function createRoom(socket) {
  return {
    player1: socket
  }
}

// function Room (socket) {
//   this.player1 = socket
// }

let roomsArray = [];

let newRoom = {};



io.on("connection", socket => {     
      
  socket.emit('push');
  socket.emit('hide-start-button');  

  // let clients =  Object.values(new Room(socket));

  const roomsAndPlayaz = () => {      

    if (roomsArray.length === 0) {    
      newRoom = createRoom(socket);      
      roomsArray.push(newRoom);   
      console.log('conditional1');     
      return;
    };   

    if (roomsArray.every( el => el.player1 != undefined) && roomsArray.every( el => el.player2 != undefined)) {    
      newRoom = createRoom(socket);      
      roomsArray.push(newRoom);   
      console.log('conditional2');     
      return;
    };   
    
    if (roomsArray.some( el => el.player2 == undefined)) {
      newRoom.player2 = socket;   
      console.log('conditional3');   
      return;      
    };  
  };

  roomsAndPlayaz();  

  console.log(roomsArray.length);
   
  clients = Object.values(newRoom);  

  

 
  
  



  
    

  

  

  

  









  if (clients[0]) client0ID.id = clients[0].id;
  if (clients[1]) client1ID.id = clients[1].id;  

  /* messenger stuff */
  socket.on('new-user', name => {    
    users[socket.id] = name;
    socket.broadcast.emit('user-connected', name);    
  });  

  socket.on('send-chat-message', message => io.emit('chat-message', {message: message, name: users[socket.id]}));  
  /* end of messenger stuff */  
  
  
  

  const fn = () => {  
    const startPlayer = newGame.currentPlayer;
    const secondPlayer = newGame.secondPlayer;       

    if (clients[0]) clients[0].emit('startPlayer', startPlayer);

    if (clients[1]) clients[1].emit('secondPlayer', startPlayer);

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
        const message = newGame.move(startPlayer, field);        
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
        const message = newGame.move(secondPlayer, field);        
        io.emit('gameField', newGame.gameField);
        
        clients.forEach(x => x.emit('emptyInfo3'));
        
        clients[1].emit('disableClient1');
        clients[0].emit('enableClient0');   
        io.emit("Am Zug: ...", startPlayer);        

        if (message === 'Game Over: Player X has won!' || message === 'Game Over: Player O has won!' || message === "It's a draw.") {
          io.emit('endMessage',message);     
          clients[0].emit('disableClient0');
          clients[1].emit('disableClient1');
        };        
        io.emit('disableOccupiedFields', newGame.gameField);
      });
    };   
  };  

  fn();

  const addViewerToClients = () => {    
    if (viewerArray[0]) {      
      if (clients[0] == undefined) {
        clients[0] = viewerArray[0];        
      };

      if (clients[1] == undefined) {
        clients[1] = viewerArray[0];       
      };    

      removeViewerFromArray();
      clients[0].emit('page-refresh'); 
      if (clients[1]) delete clients[0];       
      
      fn();
      console.log('1 after CLIENTS array: ' + clients + clients.length);
      console.log('1 after VIEWERS array: ' + viewerArray + viewerArray.length);   
    };                   
  };   

  const removeViewerFromArray = () => viewerArray.shift();

  const fnPlayerDisconnect = socket => {
    delete clients[clients.indexOf(socket)];        
    gameObject.gameField = ["","","","","","","","",""];
    io.emit('gameField', newGame.gameField); 
    io.emit('messagePlayerDisconnected');
    io.emit("messageWait");
    io.emit('emptyInfo2');
    io.emit('hide-start-button');      
    if (!clients[0] && !clients[1]) clients = [];     
    
    console.log('2 after CLIENTS array: ' + clients + clients.length);
    console.log('2 after VIEWERS array: ' + viewerArray + viewerArray.length);    
    
    socket.id === client0ID ? delete client0ID.id : delete client1ID.id;   

    setTimeout( () => !client0ID.id ? addViewerToClients() : undefined, 300);

    setTimeout( () => !client1ID.id ? addViewerToClients() : undefined, 300);   
    
    fn();

    clients.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));
  };


  clients.map(socket => socket.on('disconnect', () => fnPlayerDisconnect(socket)));

  const fnViewerDisconnect = socket => {   
    let disconnectedSocket = viewerArray[viewerArray.indexOf(socket)];       
    let FilterViewerArray = viewerArray.filter(el => el != disconnectedSocket);
    viewerArray = FilterViewerArray;
    
    console.log('3 after CLIENTS array: ' + clients + clients.length);
    console.log('3 after VIEWERS array: ' + viewerArray + viewerArray.length);
    fn();
    viewerArray.map(socket => socket.on('disconnect', () => fnViewerDisconnect(socket)));
  };

  viewerArray.map(socket => socket.on('disconnect', () => fnViewerDisconnect(socket)));   
});

webServer.listen(PORT, HOST, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/`);

});