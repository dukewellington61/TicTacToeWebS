"use strict";

const socket = io.connect();

const $  = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

/* messenger stuff */
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');
/* end of messenger stuff */


const viewTikTakToe = () => {

  return $("#TikTakToe").innerHTML = ejs.render(
    `
    <div id="gamefield">

      <div class="info">
        <p id="info1"></p>
        <p>&nbsp;  </p>
        <p id="info2"></p>
      </div>

      <table>
        <button class='button' id='0'></button>
        <button class='button' id='1'></button>
        <button class='button' id='2'></button>
        <br>
      
        <button class='button' id='3'></button>
        <button class='button' id='4'></button>
        <button class='button' id='5'></button>
        <br>
        
        <button class='button' id='6'></button>
        <button class='button' id='7'></button>
        <button class='button' id='8'></button>
        <br>
      </table>  

      <div id="info3" class="info"></div>
      <div id="info4" class="info"></div>
      <button id="start-button" type="button" class="btn btn-primary">New Game</button>
    </div>
    `
  )};

const userName = {
  hasBeenEntered: false
};

const createPlayerNameInputField = () => { 
  const ticTacToeGameField = document.getElementById('gamefield');
  const inputElement = document.createElement('input');  
  inputElement.type = 'text';
  inputElement.id = 'player-name-input';
  inputElement.placeholder = 'Enter your Name';
  inputElement.autofocus = true;
  inputElement.required = true;
  ticTacToeGameField.appendChild(inputElement);   

  let buttonElement = document.getElementById('3');
  let buttonElementRect = buttonElement.getBoundingClientRect();  

  inputElement.style.position = "absolute";
  

  window.screen.width > 799 ? inputElement.style.top = `${buttonElement.offsetTop + 19}px` : inputElement.style.top = `${buttonElement.offsetTop}px`;

  inputElement.style.height = `${buttonElementRect.height}px`;

  inputElement.style.width = `${buttonElementRect.width * 3}px`;

  console.log('inputElement.style.top: ' +  inputElement.style.top);
  console.log('buttonElement.offsetTop: ' + buttonElement.offsetTop);



  inputElement.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
      userName.hasBeenEntered = true;     
      inputElement.classList.add('player-name-input-remove');                
      socket.emit('new-user', inputElement.value);         
    };
  });   
};

const inactivityTime = function () {
  let startDuration = 60000;
  let durationInMilliseconds = startDuration;
  let durationInSeconds = durationInMilliseconds/1000;
  let time;
  let intervalVar;  
  window.onload = resetTimer;  
  document.onclick = resetTimer;
  document.onkeypress = resetTimer;

  const countDown = {
    visible: false
  };  

  function logout() {     
    document.getElementById('player-name-input').classList.add('player-name-input-remove');
    emptyInfo1();
    emptyInfo2();
    emptyInfo3();  
    emptyInfo4();   
    logoutInfo();
    socket.off('message-wait');
    socket.off('message-player-disconnected');
    socket.emit('idle-socket-disconnect', socket.id);   
    document.onclick = undefined;
    document.onkeypress = undefined;       
  };

  function countDownTimer(val) {
    if (val != null) durationInSeconds = startDuration/1000;

    durationInSeconds--;
    
    if (durationInSeconds < 11) {
      $("#info1").innerHTML = `inactivity disconnect in ${durationInSeconds} seconds`;
      countDown.visible = true;      
    };    
  };

  function stopInterval(intervalVar) {
    clearInterval(intervalVar);   
  };

  function resetTimer() {   
    clearTimeout(time);   
    clearInterval(intervalVar);  
    countDownTimer('reset');     
    if (countDown.visible === true && userName.hasBeenEntered === false) enterNameMessage();  
    if (countDown.visible === true && userName.hasBeenEntered === true) $("#info1").innerHTML = playerInfo1.info;
    countDown.visible = false;
    intervalVar = setInterval(() => countDownTimer(), 1000);
    time = setTimeout(() => {logout(); stopInterval(intervalVar)}, durationInMilliseconds);    
  };
};

inactivityTime();

const playerInfo1 = {};
  
const messageWait = () => $("#info3").innerHTML = "Please wait for an opponent";

const messageStart = () => $("#info3").innerHTML = "Two players connected.";

const startPlayerInfo = data => {  
  playerInfo1.info = `Welcome ${data.name}. You're playing as ${data.startPlayer}.`;  
  $("#info1").innerHTML = playerInfo1.info;
};

const secondPlayerInfo = data => {
  if (data.startPlayer === 'X') {    
    playerInfo1.info = `Welcome ${data.name}. You're playing as O`;   
    $("#info1").innerHTML = playerInfo1.info; 
  };

  if (data.startPlayer === 'O') {    
    playerInfo1.info = `Welcome ${data.name}. You're playing as X`;   
    $("#info1").innerHTML = playerInfo1.info; 
  };
};

const toMove = moveMessage => $("#info2").innerHTML = moveMessage;

const writeSymbolInGamefield = (symbol,field) => document.getElementById(field).textContent = symbol;  

const disableOccupiedField = gameField => {
  const arrayOfXIndices = gameField.reduce((a,e,i) => (e === 'X' || e === 'O') ? a.concat(i) : a, []);
  for (let i = 0; i < arrayOfXIndices.length; i++) {
    let idField = arrayOfXIndices[i];
    document.getElementById(idField).disabled = true;
  };
};

const disableClient = () => {  
  for (let i = 0; i < 9; i++) {
    document.getElementById(i).disabled = true;
  };
};

const enableClient = () => {  
  for (let i = 0; i < 9; i++) {
    document.getElementById(i).disabled = false;
  };
};

const endMessage = message => $("#info1").innerHTML = message;

const emptyInfo1 = () => $("#info1").innerHTML = "";

const emptyInfo2 = () => $("#info2").innerHTML = "";

const emptyInfo3 = () => $("#info3").innerHTML = "";

const emptyInfo4 = () => $("#info4").innerHTML = "";

const logoutInfo = () => $("#info1").innerHTML = "Timeout. You're disconnected";

const hideStartButton = () => $('#start-button').setAttribute('hidden', 'true');

const showStartButton = () => $('#start-button').removeAttribute('hidden');

const messagePlayerDisconnected = name => name ? $("#info1").innerHTML = `${name} has disconnected.` : 'Your opponent has disconnectd';

const messageGameStarted = () => $("#info3").innerHTML = "The game has started.";

const enterNameMessage = () => userName.hasBeenEntered === false ? setTimeout( () => $("#info1").innerHTML = "Please enter your name.", 200) : undefined;

const updateInfo1 = () => $("#info1").innerHTML = playerInfo1.info; 

/* more messenger stuff */

const emitOnce = {};

const appendMessage = data => { 
  const inputElement = document.getElementById('player-name-input');   
  const messageElement = document.createElement('div');  

  inputElement.value == data.name ? messageElement.innerText = `You: ${data.message}` : messageElement.innerText = `${data.name}: ${data.message}`;    
  
  if (emitOnce.done == true) return;

  else {
    messageContainer.appendChild(messageElement); 
    emitOnce.done = true;
    setTimeout( () => emitOnce.done = false, 5);
  };  
  scrollDown();
};

messageForm.addEventListener('submit', e => {    
  e.preventDefault();
  const message = messageInput.value;  
  socket.emit('send-chat-message', {message: message, id: socket.id});
  messageInput.value = " ";  
});

const broadCastNewUsersName = name => {
  const usersNameElement = document.getElementById('info4');  
  usersNameElement.innerText = `You're playing against ${name}`;
};

const scrollDown = () => {
  const objDiv = document.getElementById("message-container");
  objDiv.scrollTop = objDiv.scrollHeight;
};

/* end of more messenger stuff */

socket.on('push', () => {
  viewTikTakToe();
  createPlayerNameInputField()
});

socket.on('hide-start-button', () => hideStartButton());

socket.on('show-start-button', () => showStartButton());

socket.on('message-wait', () => messageWait());

socket.on('message-start', () => messageStart());

socket.on('start-player', data => startPlayerInfo(data));

socket.on('second-player', startPlayer => secondPlayerInfo(startPlayer));

socket.on('to-move', data => toMove(data.moveMessage));

socket.on('game-field', gameField => gameField.forEach((symbol,field) => writeSymbolInGamefield(symbol,field)));

socket.on('disable-occupied-fields', gameField => disableOccupiedField(gameField));

socket.on('disable-client', () => disableClient());

socket.on('enable-client', () => enableClient());

socket.on('end-message', message => {     
  emptyInfo2();
  endMessage(message.winMessage);     
});

socket.on('empty-info3', () => emptyInfo3());

socket.on('empty-info2', () => emptyInfo2());

socket.on('message-player-disconnected', name => {
  messagePlayerDisconnected(name);
  emptyInfo4(); 
});

socket.on('game-has-started', () => {messageGameStarted(); updateInfo1()});

socket.on('enter-name-message', () => enterNameMessage());



/* even more messenger stuff */
socket.on('chat-message', data => appendMessage(data));
socket.on('user-connected', name => {
  if (name) broadCastNewUsersName(name);   
});
/* end of even more messenger stuff */



$("#TikTakToe").addEventListener("click", e => {      

  if (e.composedPath()[0].id === "start-button") socket.emit("new-game");
    else {
      if (e.composedPath()[0].id === "info1" || e.composedPath()[0].id === "info2" || e.composedPath()[0].id === "info3") "";
      else socket.emit("move", e.composedPath()[0].id);
    };
});








