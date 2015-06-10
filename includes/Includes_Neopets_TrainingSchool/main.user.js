// ==UserScript==
// @name        Includes : Neopets : TrainingSchool
// @namespace   http://gm.wesley.eti.br
// @description TrainingSchool Function
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
// @require     https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
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

var TrainingSchool = function (page, pet) {
	if (!pet) {
		pet = page.activePet;
	}
	var mode = [{	// Swashbuckling Academy
		action: "http://www.neopets.com/pirates/process_academy.phtml",
		referer: "http://www.neopets.com/pirates/academy.phtml",
		items: function (pet) {
			var itemsIndexes = {},
			items = xpath("./td[2]//td[1]/img", pet),
			output = [];

			for (var ai = 0,at = items.length;ai < at;++ai) {
				var img = items[ai],
				i = {
					name	: xpath("string(../following-sibling::td[1]/b/text())", img).trim(),
					image	: img.getAttribute("src"),
					quantity: 1
				};

				if (i.name in itemsIndexes) {
					++output[itemsIndexes[i.name]].quantity;
				} else {
					itemsIndexes[i.name] = output.length;
					output.push(i);
				}
			}

			return output;
		}
	}, {	// The Mystery Island Training School
		action: "http://www.neopets.com/island/process_training.phtml",
		referer: "http://www.neopets.com/island/training.phtml",
		items: function (pet) {
			var itemsIndexes = {},
			items = xpath("./td[2]/p/img", pet),
			output = [];
			
			for (var ai = 0,at = items.length;ai < at;++ai) {
				var img = items[ai],
				i = {
					name	: xpath("string(preceding-sibling::b[1]/text())", img).trim(),
					image	: img.getAttribute("src"),
					quantity: 1
				};
				
				if (i.name in itemsIndexes) {
					++output[itemsIndexes[i.name]].quantity;
				} else {
					output.push(i);
				}
			}

			return output;
		}
	}, {	// Secret Ninja Training School
		action: "http://www.neopets.com/island/process_fight_training.phtml",
		referer: "http://www.neopets.com/island/fight_training.phtml",
		items: function (pet) {
			var itemsIndexes = {},
			items = xpath("./td[2]/p/img", pet),
			output = [];
			
			for (var ai = 0,at = items.length;ai < at;++ai) {
				var img = items[ai],
				i = {
					name	: xpath("string(preceding-sibling::b[1]/text())", img).trim(),
					image	: img.getAttribute("src"),
					quantity: 1
				};
				
				if (i.name in itemsIndexes) {
					++output[itemsIndexes[i.name]].quantity;
				} else {
					output.push(i);
				}
			}

			return output;
		}
	}][(250 < pet.stats.level?2:(40 >= pet.stats.level?0:1))],
	_post = function (data, cb) {
		data.pet_name = pet.name;
		page.request({
			method	: "post",
			action	: mode.action,
			referer	: mode.referer + "?type=courses",
			data	: data,
			delay	: true,
			callback: cb
		});
	},
	_get = function (data, cb) {
		data.pet_name = pet.name;
		page.request({
			method	: "get",
			action	: mode.referer,
			referer	: mode.referer + "?type=status",
			data	: data,
			delay	: true,
			callback: cb
		});
	},
	parse = function (o, cb) {
		//o.message = xpath("string(.//center[contains(img[1]/@src, '/island/ninja_kyrii')])", o.body);
		o.pets = xpath(".//td[@class = 'content']//table/tbody/tr[td[1][img and font]]", o.body).map(function (item) {
			var stats = xpath("./td[1]//b/text()", item).map(function (s) {
				var ss = s.textContent.replace(/[,.]/g, "");

				return (~s.textContent.indexOf("/")?ss.split(/\s+\/\s+/).map(parseFloat):parseInt(ss, 10));
			}),
			img = xpath("string(./td/img/@src)", item),
			timer = xpath("string(./td[2][not(form)]/b/text())", item).match(/\d+/g),
			timerDate;

			if (timer) {
				timerDate = new Date(page.time);
				timerDate.setUTCMilliseconds(1000 * (60 * (60 * timer[0] + 1 * timer[1]) + 1 * timer[2] + 1));
			}

			return {
				name	: img.match(/\/cpn\/(\w+)\//)[1],
				image	: img,
				timer	: timerDate,
				complete: xpath("boolean(.//input[@name = 'type' and @value = 'complete'])", item),
				items	: mode.items(item),
				stats	: {
					level	: stats[0],
					strength: stats[1],
					defence	: stats[2],
					agility	: stats[3],
					endurance: stats[4][1]
				},
				health	: stats[4][0]
			};
		});
		
		for (var ai = o.pets.length;0 <= --ai;) {
			if (o.pets[ai].name == pet.name) {
				pet = o.pets[ai];
				break;
			}
		}

		o.activePet = pet;

		console.log(o, pet);
		cb(o);
	};

	this.start = function (obj) {
		var courseType = obj.course_type || (function (stats) {
			// Endurance must be first
			// Agility must be last
			var s = ["Endurance", "Strength", "Defence", "Agility"];

			if (stats && s.every(function (item) {
				return 2 * stats.level >= stats[item.toLowerCase()];
			})) {
				s.pop();	// removes 'Agility'
				s.shift();	// removes 'Endurance'
				s.sort(function (a, b) {
					var vA = 2 * stats.level - stats[a.toLowerCase()],
					vB = 2 * stats.level - stats[b.toLowerCase()];
					
					if (vA == vB) {
						return 0;
					}
					return (vA > vB?-1:1);
				});

				return s[0];
			}

			return "Level";
		}(pet.stats)) || "Level";

		if (!courseType) {
			throw "course_type is required."
		}

		_post({
			type		: "start",
			course_type	: courseType
		}, function (o) {
			parse(o, obj.callback);
		})
	};

	this.pay = function (obj) {
		_post({
			type		: "pay"
		}, function (o) {
			parse(o, obj.callback);
		});
	};
	
	this.cancel = function (obj) {
		_post({
			type		: "cancel"
		}, function (o) {
			parse(o, obj.callback);
		});
	};

	this.complete = function (obj) {
		_post({
			type		: "complete"
		}, obj.callback);
	};

	this.status = function (obj) {
		_get({
			type		: "status"
		}, function (o) {
			parse(o, obj.callback);
		});
	};
};