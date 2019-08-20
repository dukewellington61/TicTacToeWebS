const winCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [6, 4, 2]
];



const start = () => {
  let randomNumber = Math.round(Math.random() * 1);
  if (randomNumber < 0.5) return 'X';
  else return 'O';
};

const second = () => {
  if (startPlayer === 'X') return 'O';
  else return 'X';
};

const startPlayer = start();

const secondPlayer = second();

exports.Game = function Game(player) {

   gameObject = {
     emptyGameField: ["","","","","","","","",""],
     gameField: ["","","","","","","","",""],
     currentPlayer: startPlayer,
     secondPlayer: secondPlayer,
     result: "",
     move: (symbol,field) => {
         
         if (gameObject.gameField[field] === "") {
           gameObject.gameField[field] = symbol;

           const arrayOfXIndices = gameObject.gameField.reduce((a,e,i) => (e === 'X') ? a.concat(i) : a, []); //finds all fields in board that have already symbols
           const arrayOfOIndices = gameObject.gameField.reduce((a,e,i) => (e === 'O') ? a.concat(i) : a, []); //finds all fields in board that have already symbols

           for (let [index,win] of winCombos.entries()) {
             if (win.every(elem => arrayOfXIndices.indexOf(elem) > -1) || win.every(elem => arrayOfOIndices.indexOf(elem) > -1)) {
               return `Game Over: Player ${symbol} has won!`;
             };
           };

           const numberOfSymbolsOnGameField = gameObject.gameField.filter(x => x != "").length;

           numberOfSymbolsOnGameField === 9 ? gameObject.result = 'done' : gameObject.result = symbol;

           if (gameObject.result === 'done') {
             for (let [index,win] of winCombos.entries()) {
               if (win.every(elem => arrayOfXIndices.indexOf(elem) > -1) || win.every(elem => arrayOfOIndices.indexOf(elem) > -1)) {
                 return `Game Over: Player ${symbol} has won!`
               }
               else return "It's a draw."
             };
           };

           return "";
         };
     }};
       return gameObject;
};
