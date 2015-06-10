// ==UserScript==
// @name        Includes : Neopets : SDB
// @namespace   http://gm.wesley.eti.br
// @description Bank Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.1
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

var SDB = function (page) {
	var strim = function (v) {
		return v.textContent.trim();
	},
	parse = function (o) {
		o.items = xpath(".//td[@class = 'content']//table/tbody/tr[td[1]/img and td[6]/input]", o.body).map(function (item) {
			var cells = item.cells;

			if (/^back_to_inv\[(\d+)\]$/.test(xpath("string(input/@name)", cells[5]))) {
				return {
					id		: parseInt(RegExp.$1, 10),
					image	: cells[0].firstElementChild.src,
					name	: xpath("string(./b/text())", cells[1]),
					categories: xpath(".//font", cells[1]).map(function (item) {
						return {
							type	: item.getAttribute("color"),
							name	: strim(item)
						};
					}),
					description: strim(cells[2]),
					type	: strim(cells[3]),
					quantity: parseInt(strim(cells[4]).replace(/\D+/g, ""), 10)
				};
			}
			throw "Invalid 'id'";
		});
		o.removed = [];
	},
	_post = function (data, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/process_safetydeposit.phtml?checksub=scan",
			referer	: "http://www.neopets.com/safetydeposit.phtml",
			data	: data,
			delay	: true,
			callback: function (o) {
				parse(o);
				cb(o);
			}
		});
	},
	_get = function (data, cb) {
		page.request({
			method	: "get",
			action	: "http://www.neopets.com/safetydeposit.phtml",
			referer	: "http://www.neopets.com/safetydeposit.phtml",
			data	: data,
			delay	: true,
			callback: function (o) {
				parse(o);
				cb(o);
			}
		});
	};

	this.remove = function (obj) {
		if (!obj.items || !obj.items.length) {
			throw "SDB REMOVE : 'items' is required";
		}
		var _this = this;

		if (parseInt(obj.items[0][0], 10)) {
			var data = {
				offset	: 0,
				obj_name: "",
				category: "",
				pin		: page.pin
			};
			for (var ai = 0,at = obj.items.length;ai < at;++ai) {
				data["back_to_inv[" + obj.items[ai][0] + "]"] = obj.items[ai][1] || 1;
			}

			_post(data, obj.callback);
		} else {
			var found = [];
			(function recursive (index) {
				console.log("Searching in SDB...", obj.items[index][0]);
				_this.find({
					text	: obj.items[index][0],
					callback: function (o) {
						if (o.item) {
							o.item.remove = obj.items[index][1];
							found.push(o.item);
						}

						if (++index < obj.items.length) {
							recursive(index);
						} else if (found.length) {
							console.log("Removing from SDB...", found);
							_this.remove({
								items	: found.map(function (item) {
									return [item.id, Math.min(item.remove, item.quantity)];
								}),
								callback: function (o) {
									if (!o.error) {
										o.removed = found;
									}
									obj.callback(o);
								}
							});
						} else {
							obj.callback(o);
						}
					}
				});
			}(0));
		}
	};
	
	this.find = function (obj) {
		var data = {
			offset	: 0,
			obj_name: obj.text,
			category: ""
		};

		_get(data, function (o) {
			for (var ai = 0, at = o.items.length;ai < at;++ai) {
				var item = o.items[ai];
				if (item.name == obj.text) {
					o.item = item;
					break;
				}
			}

			obj.callback(o);
		});
	};
};