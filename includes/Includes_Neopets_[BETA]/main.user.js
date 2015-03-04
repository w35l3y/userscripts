// ==UserScript==
// @name        Includes : Neopets [BETA]
// @namespace   http://gm.wesley.eti.br
// @description Neopets Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.2.2
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
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
	diff = GM_getValue("neopets-diff", 28800000),	// UTC-0800
	_b = function (v) {
		return xpath("boolean(" + v + ")", doc);
	},
	_s = function (v) {
		return xpath("string(" + v + ")", doc) || "";
	},
	_n = function (v) {
		return parseInt(_s(v).replace(/[,.]/g, ""), 10) || 0;
	},
	contentTime = doc && _s(".//script[contains(text(), 'var na =')]/text()"),
	_this = this,
	_listeners = {},
	_post = function (url, data, type) {
		return _this.request({
			action	: url,
			data	: data,
			callback: function (obj) {
				if (type in _listeners) {
					for (var ai = 0, at = _listeners[type].length;ai < at;++ai) {
						_listeners[type][ai](obj);
					}
				}
			}
		});
	};
	
	this.request = function (obj) {
		if (obj.ck) {
			if (!obj.data) {
				obj.data = {};
			}
			obj.data[obj.ck] = this.ck;
		}

		return HttpRequest.open({
			method		: obj.method || "post",
			url			: obj.action,
			headers		: {
				Referer	: obj.referer || obj.action,
			},
			onsuccess	: function (xhr) {
				var _doc = xhr.response.xml,
				_txt = xhr.response.text,
				data = {
					error	: xpath("boolean(.//img[@class = 'errorOops']|id('oops'))", _doc),
					errmsg	: xpath("string(.//div[@class = 'errorMessage']/text())", _doc),
					body	: _doc,
				};

				if (data.error) {
					if (obj.ck && !xpath("boolean(.//a[contains(@onclick, 'templateLogin')])", _doc)) {
						_this.request({
							method	: "get",
							action	: "http://www.neopets.com/space/strangelever.phtml",
							callback: function () {},
						});
					}
				} else {
					_this.document = _doc;
				}

				//console.log(xhr.response.text);
				obj.callback(data);
			}
		}).send(obj.data);
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
			set		: function (value) {
				doc = value;

				var np = _n("id('header')//td/a[contains(@href, 'inventory')]/text()"),
				_refck = _s(".//*[(@name = '_ref_ck' or @name = 'ck') and string-length(@value) = 32]/@value") || (/_ref_ck=(\w{32})/.test(_s(".//*[contains(@href, '_ref_ck')]/@href"))?RegExp.$1:""),
				listen = [
					["events", _b(".//div[@class = 'inner_wrapper2']")],
				],
				data = {
					error	: _b(".//img[@class = 'errorOops']|id('oops')"),
					errmsg	: _s(".//div[@class = 'errorMessage']/text()"),
					body	: doc,
				};

				np && (this.np = np);
				_refck && saveUserData("ck", _refck);

				for (var ai in listen) {
					if (listen[1] && listen[0] in _listeners) {
						for (var bi = 0, bt = _listeners[listen[0]].length;bi < bt;++bi) {
							_listeners[listen[0]][bi](data);
						}
					}
				}
			},
		},
		username	: {
			get		: function () {
				return (/([^=]+)$/.test(_s("id('header')//a[contains(@href, '?user=')]/@href")) && RegExp.$1 || "");
			},
		},
		loggedIn	: {
			get		: function () {
				return !_b(".//a[contains(@onclick, 'templateLogin')]");
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
				return parseInt(/\/themes\/(\d+)_/.test(_s(".//link[contains(@href, '/themes/')]/@href | .//img[contains(@src, '/themes/')][1]/@src")) && RegExp.$1 || "", 10);
			},
			set		: function (value) {
				_post("http://www.neopets.com/settings/set_theme.phtml", {
					theme	: value,
					_ref_ck	: this.ck,
				}, "theme");
			},
		},
		ck		: {
			get		: function () {
				return _userTmp.ck;
			},
		},
		np			: {
			writable: true,
			value	: 0,
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
				/*
				addEventListener("activePet", function () {})
				*/
			},
		},
		events		: {
			get		: function () {
				return xpath(".//div[@class = 'inner_wrapper2']/img[@class = 'item']", doc).map(function (item) {
					return {
						icon	: item.previousElementSibling.getAttribute("src"),
						item	: {
							name	: xpath("string(./b)", item.nextElementSibling),
							image	: item.getAttribute("src"),
						},
						message	: item.nextElementSibling.textContent.trim(),
					};
				});
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
	
	var userKey = "neopets-" + this.username,
	_userTmp = JSON.parse(GM_getValue(userKey, "{}")),
	saveUserData = function (k, v) {
		_userTmp[k] = v;
		GM_setValue(userKey, JSON.stringify(_userTmp));
	};

	this.document = doc;
};
