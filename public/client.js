const $  = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const viewTikTakToe = () => {

  return $("#TikTakToe").innerHTML = ejs.render(
    `
    <div class="info"><span id="info1">info1</span> <span id="info2">info2</span></div>

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

    <div id="info3"></div>
    `
  )};


const messageWait = () => $("#info3").innerHTML = "Bitte warten Sie auf Ihren Gegner!";

const messageStart = () => $("#info3").innerHTML = "Zwei Spieler verbunden. Spiel kann beginnen!";

const startPlayerInfo = startPlayer => $("#info1").innerHTML = `Sie spielen als ${startPlayer}`;

const secondPlayerInfo = startPlayer =>
startPlayer === 'X' ? $("#info1").innerHTML = "Sie spielen als O"
: $("#info1").innerHTML = "Sie spielen als X";

const amZug = startPlayer => $("#info2").innerHTML = `Am Zug: ${startPlayer}`;

const writeSymbolInGamefield = (symbol,field) => document.getElementById(field).textContent = symbol;

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

const endMessage = (message) => $("#info2").innerHTML = message;

const emptyInfo3 = () => $("#info3").innerHTML = "";

const viewerMessage = () =>  {
  $("#info1").innerHTML = 'Sie befinden sich im Zuschauer­Modus!';
  $("#info3").innerHTML = 'Sorry, es waren bereits genug Spieler online.';
};

const emptyInfo3Viewers = () => $("#info3").innerHTML = "";



let socket = io.connect();


socket.on("push", () => viewTikTakToe());

socket.on('messageWait', () => messageWait());

socket.on('messageStart', () => messageStart());

socket.on('startPlayer', (startPlayer) => startPlayerInfo(startPlayer));

socket.on('secondPlayer', (startPlayer) => secondPlayerInfo(startPlayer));

socket.on("Am Zug: ...", (startPlayer) => amZug(startPlayer));

socket.on("gameField", (gameField) => gameField.forEach((symbol,field) => writeSymbolInGamefield(symbol,field)));

socket.on("messageForMove", (messageForMove) => writeMessageForMove(messageForMove));

socket.on('disableClient0', () => disableClient0());

socket.on('enableClient0', () => enableClient0());

socket.on('disableClient1', () => disableClient1());

socket.on('enableClient1', () => enableClient1());

socket.on('endMessage', (message) => endMessage(message));

socket.on('emptyInfo3', () => emptyInfo3());

socket.on('viewerMessage', () => viewerMessage());

$("#TikTakToe").addEventListener("click", (e) => socket.emit("move", e.path[0].id));
