// ==UserScript==
// @name           Neopets : Food Club
// @namespace      http://gm.wesley.eti.br
// @description    Suggests bets
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2016+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.2.1
// @language       en
// @include        http://www.neopets.com/pirates/foodclub.phtml?type=bet
// @icon           http://gm.wesley.eti.br/icon.php?desc=scripts/Neopets_Food_Club/main.user.js
// @grant          GM_log
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @resource       winConfigCss ../../includes/Includes_WinConfig/resources/default.css
// @resource       foodclubJson https://gist.github.com/w35l3y/fab231758eb0991f36a0/raw/foodclub.json
// @require        https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_Neopets_[BETA]/main.user.js
// @require        ../../includes/Includes_Neopets_FoodClub/main.user.js
// @require        ../../includes/Includes_WinConfig/163374.user.js
// @noframes
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

var button = document.createElement("input"),
typeInput = xpath(".//input[@name='type' and @value='bet']")[0];
button.setAttribute("type", "button");
button.setAttribute("value", "Place predefined bets");
typeInput.parentNode.insertBefore(button, typeInput);
button.addEventListener("click", function (e) {
	var np = new Neopets(document),
	fc = new FoodClub(np),
	savedUrlKey = "bets-" + np.username;
	prompt2("Url with predefined bets", GM_getValue(savedUrlKey, "http://www.neopets.com/~"), function (cfg) {
		var r = fc.parse("bet"),
		url = cfg.text;

		if (url && r.max_bet) {	// check whether the food club is open
			fc.get(function (o) {	// retrieve the bets of a custom page
				GM_setValue(savedUrlKey, url);
				var bets = o.response.list.sort(function (a, b) {	// sort and filter the list of bets
					if (a.round == b.round) {
						return 0;
					}

					return (a.round > b.round?-1:1);
				}).filter(function (v, i, arr) {
					return v.round == arr[0].round;
				}).slice(0, 10);
				if (bets.length) {
					var row = function (i) {
						var bet = bets[i] || {arenas:[], odds:1},
						sbets = bet.arenas.map(function (arena) {
							return '<span style="color: ' + (fc.check(r.arenas, arena)?"inherit":"red") + '"><b>' + arena.name + "</b>: " + arena.pirate.name + "</span>";
						}).join("<br />");

						return '<td><input type="checkbox" name="bet_index" value="' + i + '" ' + (~sbets.indexOf(": red")?'disabled="disabled"':'checked="checked"') + ' /></td><td>' + sbets + "</td><td>" + bet.odds + ":1</td>";
					};

					var xWin = WinConfig.init({
						type	: WinConfig.WindowType.EXPLANATION,
						title	: "Food Club : Bets found",
						size	: ["666px", -1],
						description	: '<table border="1" cellpadding="2" cellspacing="0" align="center"><tr><th><input type="checkbox" checked="checked" name="bet_checkall" value="0,5" /></th><th>Info</th><th>Odds</th><th><input type="checkbox" checked="checked" name="bet_checkall" value="5,10" /></th><th>Info</th><th>Odds</th></tr>' + [0,1,2,3,4].map(function (i) {
							return "<tr>" + row(i) + row(5 + i)+ "</tr>";
						}).join("") + '</table><a href="' + url + '" target="_blank">Source</a>',
						load	: function (cfg) {
							var checked = Array.prototype.slice.apply(this.form.querySelectorAll("input[name = 'bet_index']:checked")).map(function (v) {
								return parseInt(v.value, 10);
							}),
							success = true;

							(function recursive (list, index) {	// recursively iterate through the list of bets
								if (index < list.length) {
									var bet = list[index];

									try {
										fc.bet(function (o) {
											console.log(o);
											if (o.error) {
												np.console.error("[" + (1 + index) + " / $2] Food Club : $3", 1 + index, list.length, o.errmsg);
												success = false;
											} else {
												np.console.info("[$1 / $2] Food Club : $3", 1 + index, list.length, "Success");
											}
											recursive(list, ++index);
										}, {
											check	: r.arenas,	// check whether the bets are possible
											value	: r.max_bet,	// value of the bets
											arenas	: bet.arenas,	// bets (may contain informations about arena, pirate and odds)
											odds	: bet.odds,	// odds - optional
										});
									} catch (e) {
										np.console.error("[" + (1 + index) + " / $2] Food Club : $3", 1 + index, list.length, e);
										success = false;
										recursive(list, ++index);
									}
								} else {
									np.console.log("[$1 / $2] Food Club : $3", index, list.length, "Complete");
									if (success && index) {
										location.assign("http://www.neopets.com/pirates/foodclub.phtml?type=current_bets");
									}
								}
							}(bets.filter(function (b, i) {
								return 0 <= checked.indexOf(i);
							}), 0));
						}
					});

					xpath(".//input[@name = 'bet_checkall']", xWin.form).forEach(function (bca) {
						bca.addEventListener("click", function (e) {
							var x = e.target.value.split(",").map(parseFloat);

							xpath(".//input[@name = 'bet_index']", xWin.form).forEach(function (bi) {
								if (x[0] <= bi.value && x[1] > bi.value) {
									bi.checked = e.target.checked && !bi.disabled;
								}
							});
						}, false);
					});
				} else {
					np.console.error("Food Club : No bets found");
				}
			}, {
				url	: url	// page containing the bets
			});
		}
	});
}, false);
