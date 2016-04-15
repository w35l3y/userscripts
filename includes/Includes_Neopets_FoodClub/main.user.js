// ==UserScript==
// @name        Includes : Neopets : FoodClub
// @namespace   http://gm.wesley.eti.br
// @description FoodClub Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.5.1
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @resource    foodclubJson https://gist.github.com/w35l3y/fab231758eb0991f36a0/raw/foodclub.json
// @require     https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
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
	_response = function (xhr, p) {
		Object.defineProperties(xhr, {
			response	: {
				get	: function () {
					return p(xhr)
				}
			}
		});
	},
	_get = function (data, p, cb) {
		page.request({
			method	: "get",
			action	: "http://www.neopets.com/pirates/foodclub.phtml",
			data	: data,
			delay	: true,
			callback: function (xhr) {
				p && _response(xhr, p);
				cb(xhr);
			}
		});
	},
	_post = function (data, p, cb) {
		page.request({
			method	 : "post",
			action	 : "http://www.neopets.com/pirates/process_foodclub.phtml",
			data	 : data,
			delay	 : true,
			callback: function (xhr) {
				p && _response(xhr, p);
				cb(xhr);
			}
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
			name	: json.pirates[id - 1][0],
			fa	: [
				contains(foods, json.pirates[id - 1][1]),
				contains(foods, json.pirates[id - 1][2])
			]
		};
	},
	findPirate = function (name) {
		for (var ai in json.pirates) {
			if (name == json.pirates[ai][0]) {
				return {
					id		: 1 + parseInt(ai, 10),
					name	: name,
					checked	: true,
				};
			}
		}

		console.error("Pirate not found", name);
	},
	findArena = function (name) {
		for (var ai in json.arenas) {
			if (name == json.arenas[ai][0]) {
				return {
					id		: 1 + parseInt(ai, 10),
					name	: name,
					checked	: true,
				};
			}
		}

		console.error("Arena not found", name);
	},
	IterateArena = function (type) {
		if ("previous" != type && "current" != type) {
			throw "Unknown 'type'";
		}

		this.execute = function (cb) {
			var results = [];
			(function recursive (arena) {
				_get({
					type	: type,
					id		: arena
				}, false, function (xhr) {
					results.push([arena, xhr]);

					if (!xhr.error && 5 > arena) {
						recursive(++arena);
					} else {
						_response(xhr, function () {
							return {
								arenas	: results.map(function (result) {
									var _res = _this.parse(type, result[1].body);
									_res.id = result[0];

									return _res;
								})
							};
						});

						cb(xhr);
					}
				});
			}(1));
		};
	},
	Bets = function (type, is_post) {
		this.execute = function (cb) {
			(is_post?_post:_get)({
				type : type
			}, function (xhr) {
				return _this.parse(type, xhr.body);
			}, cb);
		};
	};

	this.parse = function (type, xhr) {
		if (!xhr) {
			xhr = page.document;
		}

		switch (type) {
			case "collect":
			case "current_bets":
				var _n = function (v) {
					return parseInt(v.trim().replace(/\D+/g), 10);
				},
				totalWinnings = 0;

				return {
					list	: xpath(".//tr[2 < position() and td[5] and not(ancestor::table[1]/tbody/tr[position() = last()]/td[3])]", xhr).map(function (bet) {
						var winnings = _n(bet.cells[4].textContent);
						totalWinnings += winnings;

						return {
							round	: _n(bet.cells[0].textContent),
							arenas	: xpath("./b", bet.cells[1]).map(function (arena) {
								var _an = findArena(arena.textContent.trim());
								_an.pirate = findPirate(arena.nextSibling.textContent.trim().slice(1).trim());

								return _an
							}),
							amount	: _n(bet.cells[2].textContent),
							odds	: _n(bet.cells[3].textContent.trim().slice(0, -2)),
							winnings: winnings
						};
					}),
					winnings: totalWinnings 
				};
			case "current":
				var courses = xpath(".//a[contains(@href, '=foods&id=')]/@href", xhr).map(function (o) {
					return parseInt(o.value.match(/id=(\d+)/)[1], 10);
				});

				return {
					pirates	: xpath(".//a[contains(@href, '=pirates&id=')]/@href", xhr).map(function (o) {
						return _pirate(parseInt(o.value.match(/id=(\d+)/)[1], 10), courses);
					}).sort(function (a, b) {
						return (a.id > b.id?1:-1);
					}),
					courses	: courses
				};
			case "previous":
				return {
					pirate	: parseInt(xpath("string(.//img[contains(@src, '/fc/fc_')]/@src)", xhr).match(/pirate_(\d+)/)[1], 10)
				};
			case "bet":
				var pIndex = [],
				arenas = [],
				rawData = xpath("string(.//form[@name = 'bet_form'])", xhr.body),
				maxbet = /max_bet\s*=\s*(\d+)/.test(rawData) && parseInt(RegExp.$1, 10),
				re = /pirate_odds\[(\d+)\]\s*=\s*(\d+)/g,
				match,
				sum = 0,
				pirateSelect;
				while (match = re.exec(rawData)) {
					var arena = Math.floor(sum / 4),
					odds = parseInt(match[2], 10),
					_pi = parseInt(match[1], 10);

					if (!(sum % 4)) {
						pirateSelect = xpath(".//select[@name = 'winner" + (1 + arena) + "']", xhr.body)[0];
						pirateSelect = pirateSelect.options[pirateSelect.selectedIndex].value;

						arenas[arena] = {
							id			: 1 + arena,
							name		: json.arenas[arena][0],
							arbitrage	: 100,
							checked		: xpath(".//input[@type = 'checkbox' and @name = 'matches[]' and @value = '" + (1 + arena) + "']", xhr.body)[0].checked,
							pirates		: []
						};
					}

					arenas[arena].arbitrage -= 100 / odds;

					var pirate = {
						id		: _pi,
						name	: json.pirates[_pi - 1][0],
						checked	: (_pi == pirateSelect),
						odds	: odds
					};
					if (_pi == pirateSelect) {
						arenas[arena].pirate = pirate;
					}
					arenas[arena].pirates.push(pirate);

					++sum;
				}

				for (var ai = 0,at = arenas.length;ai < at;++ai) {
					arenas[ai].pirates.sort(function (a, b) {
						if (a.id == b.id) {
							return 0;
						}
						return (a.id > b.id?1:-1);
					});
				}

				return {
					max_bet	: maxbet,
					arenas	: arenas
				};
			case "pirates":
				var stats = xpath(".//td[@class = 'content']/center/table/tbody/tr[td[6][contains(., '%')]]/td[1]/a", xhr),
				bets = [],
				pirates = [];
				for (var ai = 0, at = stats.length;ai < at;++ai) {
					var pi = /&id=(\d+)/.test(stats[ai].href) && parseInt(RegExp.$1, 10),
					s = Array.prototype.slice.apply(stats[ai].parentNode.parentNode.cells, [1, 5]).map(function (item) {
						return parseInt(item.textContent, 10);
					});
					s.push(1 / (1 + s[3] / s[2]), s[2] / s[3]);

					pirates.push({
						id	: pi,
						stats	: s
					});
				}

				return {
					pirates	: pirates
				};
			default:
				throw "Unknown 'type'";
		}
	};

	this.get = function (cb, data) {
		return HttpRequest.open({
			method	: "GET",
			url		: data.url,
			onsuccess	: function (xhr) {
				var _data = {
					error	: false,
					errmsg	: "",
					body	: xhr.response.xml
				};
				_response(_data, function (x) {
					return _this.parse("current_bets", x.body);
				});
				cb(_data);
			}
		}).send({});
	};

	this.bet = function (cb, data) {
		if (!data || !(data.arenas instanceof Array) || 5 < data.arenas.length) {
			throw "Missing/Invalid 'arenas'";
		}

		var _t = 1,
		_d = {
			type		: "bet",
			bet_amount	: (0 < data.value?Number(data.value):50),
			matches		: [],
			winner1		: "",
			winner2		: "",
			winner3		: "",
			winner4		: "",
			winner5		: "",
			total_odds	: (0 < data.odds?data.odds + ":1":0)
		};
		data.arenas.forEach(function (b, i, a) {
			if (!b || 0 < b) {
				b = a[i] = {id: 1 + i, pirate: {id: b}};
			} else if (b && (!b.pirate || 0 < b.pirate)) {
				b.pirate = {id: b.pirate};

				if (b.pirates) {
					for (var ai in b.pirates) {
						var bb = b.pirates[ai];
						if (bb.id && (bb.checked || bb.id == b.pirate.id)) {
							b.pirate = bb;
							break;
						}
					}
				}
			}

			if (!b.id || a.some(function (x, ii) {
				return ii < i && b.id == x.id;
			})) {
				console.error("Invalid arena id", b.id, a);
				throw "Invalid arena id";
			}

			if (b.pirate.id || b.checked && b.id) {
				if (data.check) {
					for (var ai in data.check) {
						var aa = data.check[ai];
						if (aa.id == b.id) {
							var found = false;
							for (var bi in aa.pirates) {
								var bb = aa.pirates[bi];
								if (bb.id == b.pirate.id) {
									b.pirate.odds = bb.odds;
									found = true;
									break;
								}
							}

							if (!found) {
								console.error("Pirate not found in the current arena", b.pirate.id, b.id, data.check);
								throw "Pirate not found";
							}
							break;
						}
					}
				}

				_d.matches.push(b.id);
				_d["winner" + b.id] = b.pirate.id || "";

				if (0 < b.pirate.odds) {
					_t *= b.pirate.odds;
				}
			}
		});

		if (1 < _t) {
			_d.total_odds = _t + ":1";
		} else if (0 < data.odds) {
			_t = data.odds;
		}

		_d.bet_amount = Math.min(_d.bet_amount, Math.ceil(1000000 / _t));
		_d.winnings = Math.min(_t * _d.bet_amount, 1000000);

		_post(_d, function (xhr) {
			return _this.parse("current_bets", xhr.body);
		}, cb);
	};

	this.collect = function (cb) {
		new Bets("collect", true).execute(cb);
	};
	this.previousRound = function (cb) {
		new IterateArena("previous").execute(cb);
	};
	this.currentRound = function (cb) {
		new IterateArena("current").execute(cb);
	};
	this.currentBets = function (cb) {
		new Bets("current_bets").execute(cb);
	};
	this.winningBets = function (cb) {
		new Bets("collect").execute(cb);
	};
	this.odds = function (cb) {
		new Bets("bet").execute(cb);
	};
	this.pirates = function (cb) {
		new Bets("pirates").execute(cb);
	};
};
