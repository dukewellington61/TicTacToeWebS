"use strict";

const gameModule = require('./GameModule.js');
const expect = (test, res1, res2) => {
if (res1 !== res2) {
console.log('Fehler in Test ' + test);
console.log('erhalten: "' + res1 + '"');
console.log('erwartet: "' + res2 + '"');
process.exit(1);
}
};
const game1 = new gameModule.Game('X');
expect( 1, game1.move('X', 0), '');
expect( 2, game1.move('O', 2), '');
expect( 2, game1.move('O', 2), 'Ungueltiger Zug: X ist nicht am Zug!');
expect( 3, game1.move('X', 4), '');
expect( 4, game1.move('O', 8), '');
expect( 4, game1.move('X', 8), 'Ungueltiger Zug: Feld 2 ist nicht frei!');
expect( 5, game1.move('X', 3), '');
expect( 6, game1.move('O', 5), 'Spiel beendet: Spieler O hat gewonnen!');


const game2 = new gameModule.Game('O');
expect(8, game2.move('O', 0), '');
expect(9, game2.move('X', 1), '');
expect(10, game2.move('O', 2), '');
expect(11, game2.move('X', 4), '');
expect(12, game2.move('O', 7), '');
expect(13, game2.move('X', 3), '');
expect(14, game2.move('O', 5), '');
expect(15, game2.move('X', 8), '');
expect(16, game2.move('O', 6), 'Spiel endet unentschieden!');


const game3 = new gameModule.Game('X');
expect(17, game3.move('X', 0), '');
expect(18, game3.move('O', 1), '');
expect(19, game3.move('X', 2), '');
expect(20, game3.move('O', 3), '');
expect(21, game3.move('X', 4), '');
expect(22, game3.move('O', 5), '');
expect(23, game3.move('X', 7), '');
expect(24, game3.move('O', 8), '');
expect(25, game3.move('X', 6), 'Spiel beendet: Spieler X hat gewonnen!');

const game4 = new gameModule.Game('O');
expect(26, game3.move('O', 0), '');
expect(27, game3.move('X', 1), '');
expect(28, game3.move('O', 2), '');
expect(29, game3.move('X', 3), '');
expect(30, game3.move('O', 4), '');
expect(31, game3.move('X', 5), '');
expect(32, game3.move('O', 7), '');
expect(33, game3.move('X', 8), '');
expect(34, game3.move('O', 6),'Spiel beendet: Spieler O hat gewonnen!');


console.log("Test OK");
