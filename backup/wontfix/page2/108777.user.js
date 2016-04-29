// ==UserScript==
// @name           Neopets : Island Retrieval Solver
// @namespace      http://gm.wesley.eti.br
// @description    Automatically solves the Island Retrieval puzzle
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0.1
// @language       en
// @include        http://www.neopets.com/pirates/disappearance/inside-ship.phtml
// @grant          GM_log
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=108777
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page2/108777.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @history        1.0.0.1 Fixed a little bug
// ==/UserScript==

/**************************************************************************

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

**************************************************************************/

/*
day 1 : RRGGRRGGYYBBYYBB
day 2 : RGGGRGBBRRYBYYYB
day 3 : 1112211322433324435544555
day 4 : 1112213132443224353544555

http://images.neopets.com/pirates/disappearance/balance/h8d42s.png
http://images.neopets.com/pirates/disappearance/balance/9vp032.png
*/

if (!xpath("id('popup-ship-message')")[0]) {
	function init(input) {
		unsafeWindow.dojo.addOnLoad(function() {
			var puzzle = {
				chars : unsafeWindow.neopets.krawk.puzzle.Ship._pieces.length - 1,
				ship : false,
				inRow : function (n, c) {	// n=0-8 ; c=1-9
					for each (var seat in this.getShipRow(n)) {
						if (seat.occupied == c) {
							return true;
						}
					}
					return false;
				},
				inColumn : function (n, c) {	// n=0-8 ; c=1-9
					for each (var seat in this.getShipColumn(n)) {
						if (seat.occupied == c) {
							return true;
						}
					}
					return false;
				},
				inArea : function (n, c) { // n=0-8 ; c=1-9
					for each (var seat in this.getShipArea(n)) {
						if (seat.occupied == c) {
							return true;
						}
					}
					return false;
				},
				isCandidate: function (n, c) {	// n=0-80 ; c=1-9
					var coords = this.getCoordinates(n);
					return !this.inRow(coords.r, c) && !this.inColumn(coords.c, c) && !this.inArea(coords.a, c);
				},
				clearCandidates: function (n, c) {	// n=0-80 ; c=1-9
					var coords = this.getCoordinates(n), seat;
					
					for each (seat in this.getShipRow(coords.r)) {
						delete seat.candidate[c];
					}
					for each (seat in this.getShipColumn(coords.c)) {
						delete seat.candidate[c];
					}
					for each (seat in this.getShipArea(coords.a)) {
						delete seat.candidate[c];
					}
				},
				getShipRow : function (n) {	// n=0-8
					var output = [];

					for (var ai = this.chars - 1;~ai;--ai) {
						output.push(this.ship[n * this.chars + ai]);
					}

					return output;
				},
				getShipColumn : function (n) {	// n=0-8
					var output = [];

					for (var ai = this.chars - 1;~ai;--ai) {
						output.push(this.ship[n + this.chars * ai]);
					}

					return output;
				},
				getShipArea : function (n) {	// n=0-8
					var output = [];

					for (var ai in this.ship) {
						if (this.ship[ai].area == n) {
							output.push(this.ship[ai]);
						}
					}
					
					return output;
				},
				getCoordinates : function (n) {	// n=0-80
					return {
						r : Math.floor(n / this.chars),
						c : n % this.chars,
						a : this.ship[n].area
					};
				},
				smartCandidateRemoval : function(seat, list) {
					var candidates = [], c;
					for (c in seat.candidate) {
						candidates.push(c);
					}
					candidates.sort();

					var isEqual = [1, {}];
					isEqual[1][seat.index] = seat;
					for (var ai = candidates.length - 1;~ai;--ai) {
						for each (seat_r in list) {
							if (seat_r.index in isEqual[1]) {
								continue;
							}
							var candidates_r = [];
							for (c in seat_r.candidate) {
								candidates_r.push(c);
							}
							candidates_r.sort();
							var found = candidates.length == candidates_r.length;
							if (found) {
								for (c in candidates) {
									if (candidates[c] != candidates_r[c]) {
										found = false;
										break;
									}
								}
								if (found) {
									isEqual[1][seat_r.index] = seat_r;
									++isEqual[0];
								}
							}
						}
					}
					found = false;
					if (isEqual[0] == candidates.length) {
						for each (seat_r in list) {
							if (!(seat_r.index in isEqual[1])) {
								for each (c in candidates) {
									if (c in seat_r.candidate) {
										found = true;
										delete seat_r.candidate[c];
									}
								}
							}
						}
					}
					return found;
				},
				parseShip : function (text) {
					text = text.replace(/(?:[^\w]|_)+/g, "").toUpperCase().split("");

					if (Math.pow(this.chars, 2) == text.length) {
						var groups = {}, counter = -1, c, _ship = [];
						for (key in text) {
							var c = text[key++];
							if (c in groups) {
								if (++groups[c][0] > this.chars) {
									return false;
								}
							} else {
								groups[c] = [1, ++counter];

								if (counter > this.chars) {
									return false;
								}
							}

							_ship.push({
								"index" : key,
								"area" : groups[c][1],
								"occupied" : unsafeWindow.neopets.krawk.puzzle.Ship.getSeatedCharId(key),
								"candidate" : {}
							});
						}

						this.ship = _ship;

						return true;
					}

					return false;
				}
			};

			while (null !== (input = prompt("Input must contain " + Math.pow(puzzle.chars, 2) + " caracters divided into " + puzzle.chars + " groups.\n", input || "")) && !puzzle.parseShip(input));

			if (puzzle.ship) {
				var seat;
				// Fill candidates
				for each (seat in puzzle.ship) {
					var key;
					if (!seat.occupied) {
						for (key in unsafeWindow.neopets.krawk.puzzle.Ship._pieces) {
							if (unsafeWindow.neopets.krawk.puzzle.Ship._pieces[key] && puzzle.isCandidate(seat.index - 1, key)) {
								seat.candidate[key] = key;
							}
						}
					}
				}
				
				while (true) {
					var modified = false;

					for each (seat in puzzle.ship) {
						if (!seat.occupied) {
							var candidates = [], c,
							coords = puzzle.getCoordinates(seat.index - 1);

							for (c in seat.candidate) {
								candidates.push(c);
							}

							if (1 == candidates.length) {
								document.getElementById("puzzle-character-" + candidates[0]).click();
								document.getElementById("puzzle-position-" + seat.index).click();
								seat.occupied = candidates[0];
								seat.candidate = {};
								puzzle.clearCandidates(seat.index - 1, c);
								modified = true;
							} else {
								if (puzzle.smartCandidateRemoval(seat, puzzle.getShipRow(coords.r)))modified = true;
								if (puzzle.smartCandidateRemoval(seat, puzzle.getShipColumn(coords.c)))modified = true;
								if (puzzle.smartCandidateRemoval(seat, puzzle.getShipArea(coords.a)))modified = true;
							}
						}
					}

					if (!modified) {
						break;
					}
				}
			}
		});
	}

	// Retrieving input...
	GM_xmlhttpRequest({
		"method" : "get",
		"url" : "http://pastebin.com/raw/4FTXByRZ",
		"onload" : function (xhr) {
			init(/^2/.test(xhr.status)?xhr.responseText:"");
		},
		"onerror" : function () {
			init("");
		}
	});
}
