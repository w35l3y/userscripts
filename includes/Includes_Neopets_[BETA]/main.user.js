// ==UserScript==
// @name        Includes : Neopets [BETA]
// @namespace   http://gm.wesley.eti.br
// @description Neopets Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.1.1
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_getValue
// @grant       GM_setValue
// @icon        http://gm.wesley.eti.br/icon.php?desc=includes/Includes_Neopets_[BETA]/main.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
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

var Neopets = function (doc) {
	var createdAt = new Date(),
	diff = GM_getValue("neopets-diff", 0),
	_s = function (v) {
		return xpath("string(" + v + ")", doc) || "";
	},
	_n = function (v) {
		return parseInt(_s(v).replace(/[,.]/g, ""), 10) || 0;
	},
	contentTime = doc && _s(".//script[contains(text(), 'var na =')]/text()"),
	_listeners = {},
	_post = function (url, data, type) {
		HttpRequest.open({
			method		: "post",
			url			: url,
			onsuccess	: function (xhr) {
				doc = xhr.response.xml;

				if (type in _listeners) {
					for (var ai = 0, at = _listeners[type].length;ai < at;++ai) {
						_listeners[type][ai](doc);
					}
				}
			}
		}).send(data);
	};

	if (contentTime) {
		var re = /var n([hms]) = (\w+)/g,
		isPm = /var na = "(\w+)/.test(contentTime) && "pm" == RegExp.$1,
		staticTime = {};

		while (re.exec(contentTime)) {
			staticTime[RegExp.$1] = parseInt(RegExp.$2, 10);
		}

		createdAt = new Date(Date.UTC(
			createdAt.getUTCFullYear(),
			createdAt.getUTCMonth(),
			createdAt.getUTCDate(),
			(staticTime.h % 12) + (12 * isPm) - (createdAt.getUTCHours() < createdAt.getHours()?24:0),
			staticTime.m,
			staticTime.s,
			createdAt.getUTCMilliseconds()
		)),
		diff = Date.now() - createdAt;
		GM_setValue("neopets-diff", diff);
	} else {
		createdAt.setUTCMilliseconds(createdAt.getUTCMilliseconds() - diff);
	}
	
	this.addListener = function (type, callback) {
		if (type in _listeners) {
			_listeners[type].push(callback);
		} else {
			_listeners[type] = [callback];
		}
	};
	
	this.getTime = function () {
		return new Date(Date.now() - diff);
	};
	
	this.getDocument = function () {
		return doc;
	};

	Object.defineProperties(this, {
		staticTime	: {
			value	: createdAt,
		},
		time		: {
			get		: this.getTime,
		},
		document	: {
			get		: this.getDocument,
		},
		username	: {
			get		: function () {
				return (/([^=]+)$/.test(_s("id('header')//a[contains(@href, '?user=')]/@href")) && RegExp.$1 || "");
			},
		},
		language	: {
			get		: function () {
				return (/var nl = "(\w+)/.test(_s(".//script[contains(text(), 'var nl =')]/text()")) && RegExp.$1 || "");
			},
			set		: function (value) {
				_post("http://www.neopets.com/search.phtml", {
					lang	: value,
				}, "language");
			},
		},
		search		: {
			get		: function () {
				return _s("id('footer')//input[@name = 'q']/@value");
			},
			set		: function (value) {
				_post("http://www.neopets.com/search.phtml", {
					q	: value,
				}, "search");
			}
		},
		theme		: {
			get		: function () {
				return (/\/themes\/(\w+)/.test(_s(".//link[contains(@href, '/themes/')]/@href | .//img[contains(@src, '/themes/')][1]/@src")) && RegExp.$1 || "");
			},
			set		: function (value) {
				throw "Not implemented yet";
			},
		},
		np			: {
			get		: function () {
				return _n("id('header')//td/a[contains(@href, 'inventory')]/text()");
			},
		},
		nc			: {
			get		: function () {
				return _n("id('header')//td/a[contains(@href, 'mall/index.phtml')]/text()");
			},
		},
		activePet	: {
			get		: function () {
				var o = {};

				Object.defineProperties(o, {
					name	: {
						get	: function () {
							return _s(".//a[contains(@href, 'quickref.phtml')]/descendant::text()");
						},
					},
					image	: {
						get	: function () {
							return _s(".//a[contains(@href, 'quickref.phtml')]/img/@src");
						},
					},
					species	: {
						get	: function () {
							return _s(".//td[@class = 'activePetInfo']//tr[1]/td[2]/descendant::text()");
						},
					},
					health	: {
						get	: function () {
							return _s(".//td[@class = 'activePetInfo']//tr[2]/td[2]/descendant::text()").split(/\s+\/\s+/).map(function (v) {
								return parseInt(v, 10) || 0;
							});
						},
					},
					mood	: {
						get	: function () {
							return _s(".//td[@class = 'activePetInfo']//tr[3]/td[2]/descendant::text()");
						},
					},
					hunger	: {
						get	: function () {
							return _s(".//td[@class = 'activePetInfo']//tr[4]/td[2]/descendant::text()");
						},
					},
					age		: {
						get	: function () {
							return _n(".//td[@class = 'activePetInfo']//tr[5]/td[2]/descendant::text()");
						},
					},
					level	: {
						get	: function () {
							return _n(".//td[@class = 'activePetInfo']//tr[6]/td[2]/descendant::text()");
						},
					},
				});

				return o;
			},
			set		: function (value) {
				_post("http://www.neopets.com/process_changepet.phtml", {
					new_active_pet	: value,
				}, "activePet");
			},
		},
		friends		: {
			get		: function () {
				throw "Not implemented yet";

				return [{
					avatar	: "",
					username: "",
					avatar	: "",
				}];
			},
		},
	});
};
