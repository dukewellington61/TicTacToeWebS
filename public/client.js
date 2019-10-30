"use strict";

const socket = io.connect();

const $  = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

/* messenger stuff */
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-window');
const messageInputElement = document.getElementById('message-input');
const nameInputElement = document.createElement('input');  

/* end of messenger stuff */


const viewTikTakToe = () => {

  return $("#TikTakToe").innerHTML = ejs.render(
    `
    <div id="gamefield">

      <div id="info1and2container">     
        <div id="info1" class="info"></div>      
        <div id="info2" class="info"></div>
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
  
  nameInputElement.type = 'text';
  nameInputElement.id = 'player-name-input';
  nameInputElement.placeholder = 'Enter your Name';    
  ticTacToeGameField.appendChild(nameInputElement);   
  nameInputElement.maxLength = 10;    

  positionElement(nameInputElement);

  
  nameInputElement.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
      if (nameInputElement.value.length === 0) return;
      if (!nameInputElement.value.replace(/\s/g, '').length) return; //checks if input has only whitespace characters
      userName.hasBeenEntered = true;     
      removeNameInputElement(nameInputElement);                
      socket.emit('new-user', nameInputElement.value);     
      displayChatArea();
      sendHeightToParentWindow();
      // checkMobileScreenOrientation();
    };
  });   
};

const displayChatArea = () => $('#chat-area').classList.remove('chat-area-display-none');

const removeNameInputElement = el => el.classList.add('player-name-input-remove'); 

const positionElement = el => { 
  let tileElement = document.getElementById('3');
  let tileElementRect = tileElement.getBoundingClientRect();  

  el.style.position = "absolute";  

  el.style.height = `${tileElementRect.height * 0.75}px`;

  el.style.width = `${tileElementRect.width * 2.75}px`;

  el.style.top = `${tileElement.offsetTop + ((tileElementRect.height - parseInt(el.style.height))/2)}px`;  

  el.style.left = `${tileElementRect.left + (((tileElementRect.width * 3) - parseInt(el.style.width))/2)}px`;    

  widthChatElements(`${tileElementRect.width * 3}px`);  
};

const widthChatElements = width => {
  let messageContainerElement = document.getElementById('message-window');
  messageContainerElement.style.width = width;
  messageInputElement.style.width = width;
};

window.addEventListener("resize", () => positionElement(nameInputElement));

const removeChatArea = () => {
  $('#chat-area').classList.add('chat-area-diplay-none');
};

const createReconnectButton = () => {
  const ticTacToeGameField = document.getElementById('gamefield');
  const reconnectButtonElement = document.createElement('button');   
  ticTacToeGameField.appendChild(reconnectButtonElement);   
  reconnectButtonElement.id = 'reconnect-button';
  reconnectButtonElement.type = 'button';
  reconnectButtonElement.classList.add('btn', 'btn-dark');
  reconnectButtonElement.innerText = 'reconnect'
  positionElement(reconnectButtonElement);  

  reconnectButtonElement.addEventListener('click', () => {location.reload(); hideReconnectButton(); sendHeightToParentWindow()});

  const hideReconnectButton = () => reconnectButtonElement.classList.add('reconnect-button-display-none');

  window.addEventListener("resize", () => positionElement(reconnectButtonElement));  
};

const sendHeightToParentWindow = val => {   
  if (val) window.parent.postMessage(`85vw`, "*");
  else {
    const bodyHeight = $('body').scrollHeight;  
    window.parent.postMessage(`${bodyHeight + 100}px`, "*");
  };
};

const inactivityTime = function () {
  let startDuration = 600000;
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
    removeChatArea();
    createReconnectButton();
    socket.off('message-wait');
    socket.off('message-player-disconnected');
    socket.emit('idle-socket-disconnect', socket.id);   
    document.onclick = undefined;
    document.onkeypress = undefined;  
    sendHeightToParentWindow();    
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
  playerInfo1.info = `${data.name}, you're ${data.startPlayer}.&nbsp`;  
  $("#info1").innerHTML = playerInfo1.info;
};

const secondPlayerInfo = data => {
  if (data.startPlayer === 'X') {    
    playerInfo1.info = `${data.name}, you're O.&nbsp`;   
    $("#info1").innerHTML = playerInfo1.info; 
  };

  if (data.startPlayer === 'O') {    
    playerInfo1.info = `${data.name}, you're X.&nbsp`;   
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

const showStartButton = () => {  
  const startButton = document.getElementById('start-button');
  startButton.removeAttribute('hidden');
  positionElement(startButton);
  window.addEventListener("resize", () => positionElement(startButton));
};

const messagePlayerDisconnected = name => name ? $("#info1").innerHTML = `${name} has disconnected.` : 'Your opponent has disconnectd';

const messageGameStarted = () => $("#info3").innerHTML = "The game has started.";

const enterNameMessage = () => userName.hasBeenEntered === false ? $("#info1").innerHTML = "Please enter your name." : undefined;

const updateInfo1 = () => $("#info1").innerHTML = playerInfo1.info; 


/* more messenger stuff */

const emitOnce = {};

const appendMessage = data => { 
  const inputElement = document.getElementById('player-name-input');   
  const messageElement = document.createElement('div');  
  messageElement.style.color = 'white';
  messageElement.style.fontWeight = 'bold';
  // inputElement.value == data.name ? messageElement.innerText = `You: ${data.message}` : messageElement.innerText = `${data.name}: ${data.message}`;   
  
  if (inputElement.value == data.name) {
    messageElement.innerText = `You: ${data.message}`;
    messageElement.style.backgroundColor = 'orange';
    messageElement.style.opacity = '0.5';
  } 

  else {
    messageElement.innerText = `${data.name}: ${data.message}`;   
    messageElement.style.backgroundColor = 'blue';
    messageElement.style.opacity = '0.5';
  };

  
  if (emitOnce.done == true) return;

  else {
    messageContainer.appendChild(messageElement); 
    emitOnce.done = true;
    setTimeout( () => emitOnce.done = false, 5);
  };  
  scrollDown();
};

messageInputElement.addEventListener('keyup', e => {
  if (e.keyCode === 13 && userName.hasBeenEntered === true) {
    e.preventDefault();
    const message = messageInput.value;  
    socket.emit('send-chat-message', {message: message, id: socket.id});
    messageInput.value = " ";      
  };
});   

const broadCastNewUsersName = name => {
  const usersNameElement = document.getElementById('info4');  
  usersNameElement.innerText = `You're playing against ${name}`;
};

const scrollDown = () => {
  const objDiv = document.getElementById("message-window");
  objDiv.scrollTop = objDiv.scrollHeight;
};

/* end of more messenger stuff */

window.addEventListener('message', msg => {
  if (msg.data === 'reload-app') location.reload();
  sendHeightToParentWindow(msg);
});

socket.on('push', () => {
  viewTikTakToe();
  setTimeout( () => createPlayerNameInputField(), 200);
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

socket.on('end-message', message => {emptyInfo2(); endMessage(message.winMessage)});

socket.on('empty-info3', () => emptyInfo3());

socket.on('empty-info2', () => emptyInfo2());

socket.on('message-player-disconnected', name => {messagePlayerDisconnected(name); emptyInfo4()});

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

// setInterval( () =>  window.parent.postMessage('ping', "*"), 1000);

const checkIfAppSleepsAfterTurnMobileScreenOnAgain = () => {  
  let info3Elel = document.querySelector('#info3');
  let playerNameInputEl = document.querySelector('#player-name-input');  
  let reconnectButtonEl = document.querySelector('#reconnect-button');  
  let chatAreaEl = document.querySelector('#chat-area');

  if (
    !info3Elel.innerText 
    && playerNameInputEl.classList.contains('player-name-input-remove') 
    && !reconnectButtonEl 
    && chatAreaEl.classList.contains('chat-area-diplay-none')) {
      window.parent.postMessage('app-sleeps', "*");
      console.log('style.js: app-sleeps');
  };
  
};

setInterval(checkIfAppSleepsAfterTurnMobileScreenOnAgain, 1000);




// const checkMobileScreenOrientation = () => {    

//   const mobilePortrait = screen.height > screen.width && screen.orientation.angle === 0 || screen.orientation.angle === 180;

//   const mobileLandscape = screen.height < screen.width && screen.orientation.angle === 90 || screen.orientation.angle === 270;

//   const tabletPortrait = screen.height > screen.width && screen.orientation.angle === 90 || screen.orientation.angle === 270;

//   const tabletLandscape = screen.height < screen.width && screen.orientation.angle === 0 || screen.orientation.angle === 180;

//   console.log('screen.orientation.angle: ' + screen.orientation.angle);
//   console.log('mobilePortrait: ' + mobilePortrait);
//   console.log('mobileLandscape: ' + mobileLandscape);
//   console.log('tabletPortrait: ' + tabletPortrait);
//   console.log('tabletLandscape: ' + tabletLandscape);

//   if (mobilePortrait || tabletPortrait) {    
//     document.querySelector('body').classList.add('screen-in-portrait-mode');
//     sendHeightToParentWindow();
//     document.querySelector('#chat-area').classList.add('chat-area-portrait');
//   };

//   if (mobileLandscape || tabletLandscape) {
//     document.querySelector('body').classList.remove('screen-in-portrait-mode');
//     document.querySelector('#chat-area').classList.remove('chat-area-portrait');
//   };
// };

// window.addEventListener("orientationchange", () => checkMobileScreenOrientation());


const sendAppHeightToParentIfMobileScreenPortraitMode = () => {  

  alert('screen.orientation.angle: ' + screen.orientation.angle);

  const mobilePortrait = screen.height > screen.width && screen.orientation.angle === 0;  

  if (mobilePortrait) setTimeout( () => sendHeightToParentWindow(), 500);
};  

window.addEventListener("orientationchange", () => sendAppHeightToParentIfMobileScreenPortraitMode());





