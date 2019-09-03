const $  = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

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
      <button id="start-button" type="button" class="btn btn-primary">New Game</button>
    </div>
    `
  )};

  
const messageWait = () => $("#info3").innerHTML = "Please wait for your opponent";

const messageStart = () => $("#info3").innerHTML = "Two players connected. ";

const startPlayerInfo = startPlayer => $("#info1").innerHTML = `You're playing as ${startPlayer}.`;

const secondPlayerInfo = startPlayer =>
startPlayer === 'X' ? $("#info1").innerHTML = "You're playing as O"
: $("#info1").innerHTML = "You're playing as X";

const amZug = startPlayer => $("#info2").innerHTML = `Player ${startPlayer}'s turn`;

const writeSymbolInGamefield = (symbol,field) => document.getElementById(field).textContent = symbol;  

const disableOccupiedField = (gameField) => {
  const arrayOfXIndices = gameField.reduce((a,e,i) => (e === 'X' || e === 'O') ? a.concat(i) : a, []);
  for (let i = 0; i < arrayOfXIndices.length; i++) {
    let idField = arrayOfXIndices[i];
    document.getElementById(idField).disabled = true;
  };
};

const writeMessageForMove = messageForMove =>  $("#info3").innerHTML = messageForMove;

const disableClient0 = () => {
  for (let i = 0; i < 9; i++) {
  document.getElementById(i).disabled = true;
  };
};

const enableClient0 = () => {
  for (let i = 0; i < 9; i++) {
  document.getElementById(i).disabled = false;
  };
};

const disableClient1 = () => {
  for (let i = 0; i < 9; i++) {
  document.getElementById(i).disabled = true;
  };
};

const enableClient1 = () => {
  for (let i = 0; i < 9; i++) {
  document.getElementById(i).disabled = false;
  };
};

const endMessage = (message) => $("#info1").innerHTML = message;

const emptyInfo3 = () => $("#info3").innerHTML = "";

const emptyInfo2 = () => $("#info2").innerHTML = "";

const viewerMessage = () =>  {
  $("#info1").innerHTML = "You're in observer mode";
  $("#info3").innerHTML = 'Sorry, there are two players already.';
};

const emptyInfo3Viewers = () => $("#info3").innerHTML = "";

const hideStartButton = () => $('#start-button').setAttribute('hidden', 'true');

const showStartButton = () => $('#start-button').removeAttribute('hidden');

const messagePlayerDisconnected = () => $("#info1").innerHTML = "Your opponent has fled the battlefield.";

const messageGameStarted = () => $("#info3").innerHTML = "The game has started.";

let socket = io.connect();

// const fnDoStuff = () => {
//   console.log('test');
//   window.open("http://127.0.0.1:8081/", "_blank");
// };

socket.on('push', () => viewTikTakToe());

socket.on('hide-start-button', () => hideStartButton());

socket.on('show-start-button', () => showStartButton());

socket.on('messageWait', () => messageWait());

socket.on('messageStart', () => messageStart());

socket.on('startPlayer', (startPlayer) => startPlayerInfo(startPlayer));

socket.on('secondPlayer', (startPlayer) => {
  secondPlayerInfo(startPlayer);
});

socket.on('Am Zug: ...', (startPlayer) => amZug(startPlayer));

socket.on('gameField', (gameField) => gameField.forEach((symbol,field) => writeSymbolInGamefield(symbol,field)));

socket.on('disableOccupiedFields', (gameField) => disableOccupiedField(gameField));

socket.on("messageForMove", (messageForMove) => writeMessageForMove(messageForMove));

socket.on('disableClient0', () => disableClient0());

socket.on('enableClient0', () => enableClient0());

socket.on('disableClient1', () => disableClient1());

socket.on('enableClient1', () => enableClient1());

socket.on('endMessage', (message) => {
  console.log(endMessage(message));
  showStartButton();  
  console.log(showStartButton()); 
  emptyInfo2();
  socket.emit("move");   
});

socket.on('endMessage', () => location.reload(true));

socket.on('emptyInfo3', () => emptyInfo3());

socket.on('emptyInfo2', () => emptyInfo2());

socket.on('viewerMessage', () => viewerMessage());

socket.on('messagePlayerDisconnected', () => messagePlayerDisconnected());

socket.on('game-has-started', () => messageGameStarted());

$("#TikTakToe").addEventListener("click", (e) => {
  if (e.path[0].id === "start-button") socket.emit("newGame");
    else {
      if (e.path[0].id === "info1" || e.path[0].id === "info2" || e.path[0].id === "info3") "";
      else socket.emit("move", e.path[0].id);
    };
});

// socket.on('reconnect', () => fnDoStuff());





