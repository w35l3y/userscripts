// ==UserScript==
// @name        Includes : Neopets : FoodClub
// @namespace   http://gm.wesley.eti.br
// @description FoodClub Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_[BETA]/main.user.js
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

var FoodClub = function (page) {
	var _this = this,
	_get = function (data, cb) {
		page.request({
			method	: "get",
			action	: "http://www.neopets.com/pirates/foodclub.phtml",
			data	: data,
			delay	: true,
			callback: cb,
		});
	},
	json = JSON.parse(GM_getResourceText("foodclubJson")),
	contains = function (foods, pFoods) {
		var output = 0;
		for (var ai = 0, at = foods.length;ai < at;++ai) {
			var ff = json.foods[foods[ai] - 1][1];
			for (var bi = 0, bt = pFoods.length;bi < bt;++bi) {
				if (~ff.indexOf(pFoods[bi])) {
					++output;
				}
			}
		}
		return output;
	},
	_pirate = function (id, foods) {
		return {
			id	: id,
			fa	: [
				contains(foods, json.pirates[id - 1][1]),
				contains(foods, json.pirates[id - 1][2])
			],
		};
	},
	IterateArena = function (type) {
		var convert;
		if ("previous" == type) {
			convert = function (id, body) {
				return {
					id		: id,
					pirate	: parseInt(xpath("string(.//img[contains(@src, '/fc/fc_')]/@src)", body).match(/pirate_(\d+)/)[1], 10),
				}
			};
		} else if ("current" == type) {
			convert = function (id, body) {
				var courses = xpath(".//a[contains(@href, '=foods&id=')]/@href", body).map(function (o) {
					return parseInt(o.value.match(/id=(\d+)/)[1], 10);
				});

				return {
					id		: id,
					pirates	: xpath(".//a[contains(@href, '=pirates&id=')]/@href", body).map(function (o) {
						return _pirate(parseInt(o.value.match(/id=(\d+)/)[1], 10), courses);
					}).sort(function (a, b) {
						return (a.id > b.id?1:-1);
					}),
					courses	: courses,
				};
			};
		} else {
			throw "Unknown 'type'";
		}
		this.execute = function (cb) {
			var results = [];
			(function recursive (arena) {
				_get({
					type	: type,
					id		: arena,
				}, function (obj) {
					results.push(convert(arena, obj.body));

					if (!obj.error && 5 > arena) {
						recursive(++arena);
					} else {
						obj.results = results;
						cb.call(_this, obj);
					}
				});
			}(1));
		};
	};

	this.odds = function (cb) {
		_get({
			type	: "bet",
		}, function (obj) {
			var pIndex = [],
			arenas = [],
			rawData = xpath("string(.//form[@name = 'bet_form'])", obj.body),
			maxbet = /max_bet\s*=\s*(\d+)/.test(rawData) && parseInt(RegExp.$1, 10),
			re = /pirate_odds\[(\d+)\]\s*=\s*(\d+)/g,
			match,
			sum = 0;
			while (match = re.exec(rawData)) {
				var arena = Math.floor(sum / 4),
				odds = parseInt(match[2], 10);
				if (!(sum % 4)) {
					arenas[arena] = {
						id			: 1 + arena,
						arbitrage	: 100,
						pirates		: [],
					};
				}

				arenas[arena].arbitrage -= 100 / odds;

				arenas[arena].pirates.push({
					id		: parseInt(match[1], 10),
					odds	: odds,
				});

				++sum;				
			}

			for (var ai = 0,at = arenas.length;ai < at;++ai) {
				arenas[ai].pirates.sort(function (a, b) {
					return (a.id > b.id?1:-1);
				});
			}
			obj.results = [{
				arenas	: arenas,
			}];
			cb.call(_this, obj);
		});
	};

	this.pirates = function (cb) {
		_get({
			type	: "pirates",
		}, function (obj) {
			var stats = xpath(".//td[@class = 'content']/center/table/tbody/tr[td[6][contains(., '%')]]/td[1]/a", obj.body),
			bets = [],
			pirates = [];
			for (var ai = 0, at = stats.length;ai < at;++ai) {
				var pi = /&id=(\d+)/.test(stats[ai].href) && RegExp.$1,
				s = Array.prototype.slice.apply(stats[ai].parentNode.parentNode.cells, [1, 5]).map(function (item) {
					return parseInt(item.textContent, 10);
				});
				s.push(1 / (1 + s[3] / s[2]), s[2] / s[3]);

				pirates.push({
					id		: pi,
					stats	: s,
				});
			}
			obj.results = [{
				pirates	: pirates,
			}];
			cb.call(_this, obj);
		});
	};
	this.previousRound = function (cb) {
		new IterateArena("previous").execute(cb);
	};
	this.currentRound = function (cb) {
		new IterateArena("current").execute(cb);
	};
};