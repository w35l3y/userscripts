// ==UserScript==
// @name           Neopets : Pyramids
// @namespace      http://gm.wesley.eti.br
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2015+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.1.0
// @language       en
// @include        http://www.neopets.com/games/pyramids/*
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../backup/132073.user.js
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

AjaxUpdate.init({
	root		: "id('content')/table/tbody/tr/td[2]/div[2]/div",
	triggers	: ".//a[contains(@href, '?action=')]|.//form[contains(@action, 'pyramids')]",
	onsuccess	: function (obj) {
		var x = xpath(".//a[contains(@href, 'action=collect')]|.//form[contains(@action, 'pyramids.phtml')]", obj.document)[0],
		next = function (p) {
			return window.setTimeout(obj.next, 1232 + Math.ceil(1567 * Math.random()), p);
		};

		if (x) {
			var start = -1;

			if (xpath("boolean(.//div[2]/div[1]/p/img[contains(@src, 'pyramids_front')])", obj.document)) {
				if (!xpath("boolean(.//div[2]/p[3]/b[2]/text())", obj.document)) {
					start = 0;
				}
			} else if (xpath("boolean(.//div[2]/p[1]/b[8]/text())", obj.document)) {	// reached daily limit
				start = 1;
//			} else if (x.href && !xpath("boolean(.//center/table/tbody/tr[1]/td/img[contains(@src, '/images/blank.gif')])", obj.document)) { // not cleared = cancel
//				x.href = x.href.replace("/pyramids.phtml?action=collect", "/index.phtml?action=cancel");
			}

			if (start) {
				GM_deleteValue("cards");
			}

			if (1 != start) {
				next(x);
			}
		} else {
			if (/\/(\d+)_(\w)/.test(xpath("string(.//tr[2]/td/table/tbody/tr[1]/td/img[position() = last()]/@src)", obj.document))) {
				var value = parseInt(RegExp.$1, 10),
				pile = "cdhs".indexOf(RegExp.$2[0]) + 4 * (value - 2),
				cards = JSON.parse(GM_getValue("cards", "{}")),
				draw = xpath(".//a[contains(@href, 'action=draw')]", obj.document)[0],
				acards = [],
				choices = [];

				cards[pile] = {
					type	: 2,	// pile
					value	: value,
				};

				for each (var card in xpath(".//tr[2]/td/center/table/tbody/tr/td/a/img[contains(@src, '_')]", obj.document)) {
					if (/\/(\d+)_(\w)/.test(card.src)) {
						value = parseInt(RegExp.$1, 10);

						var index = "cdhs".indexOf(RegExp.$2[0]) + 4 * (value - 2),
						left = card.parentNode.previousElementSibling && card.parentNode.previousElementSibling,
						right = card.parentNode.nextElementSibling && card.parentNode.nextElementSibling,
						freed = 0;

						if (left && /blank/.test(left.src)) {
							++freed;
						}
						if (right && /blank/.test(right.src)) {
							++freed;
						}
						
						acards.push(index);
						cards[index] = {
							link	: card.parentNode.href,
							type	: 1,	// face-up
							level	: xpath("./ancestor::tr[1]", card)[0].rowIndex,
							freed	: freed,
							value	: value,
						};
					}
				}

				for (var ai = 8, at = (52 + 4 * Math.floor((pile - 4) / 4)) % 52;ai;--ai,++at) {
					if (4 == ai) {
						at += 4;
						at %= 52;
					}

					if (cards[at] && 1 == cards[at].type) {
						choices.push(at);
					}
				}
				
				if (!choices.length) {
					next(draw || {
						action	: cards[acards[Math.floor(acards.length * Math.random())]].link,
					});
				} else if (1 == choices.length) {
					var card = cards[choices[0]];
					card.type = -1;	// play
					next({
						action	: card.link,
					});
				} else {
					for (var ai in choices) {
						var same = [0, 0];

						for (var bi in cards) {
							if (cards[choices[ai]].value == cards[bi].value) {
								++same[~~(2 == cards[choices[ai]].type)];
							}
						}
						
						cards[choices[ai]].same = same;
					}

					choices.sort(function (a, b) {
						var cA = cards[a],
						cB = cards[b];

						// this can be improved to select a better option to form a greater sequence of cards
						if (cA.freed == cB.freed) {	// same freed cards
							if (cA.same[1] == cB.same[1]) {	// same number (pile)
								if (cA.same[0] == cB.same[0]) {	// same number
									if (cA.level == cB.level) {	// same card level
										return 0;
									} else {
										return (cA.level > cB.level?-1:1);	// desc
									}
								} else {
									return (cA.same[0] > cB.same[0]?-1:1);	// desc
								}
							} else {
								return (cA.same[1] > cB.same[1]?1:-1);	// asc
							}
						} else {
							return (cA.freed > cB.freed?-1:1);	// desc
						}
					});

					var card = cards[choices.shift()];
					card.type = -1;	// play
					next({
						action	: card.link,
					});
				}

				GM_setValue("cards", JSON.stringify(cards));
			}
		}
	},
});
