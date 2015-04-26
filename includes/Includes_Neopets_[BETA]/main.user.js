// ==UserScript==
// @name        Includes : Neopets [BETA]
// @namespace   http://gm.wesley.eti.br
// @description Neopets Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.3.2
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
		return xpath("string(" + v + ")", doc).trim() || "";
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
	},
	_punct = ".,",
	processDocument = function (d) {
		return {
			error	: xpath("boolean(.//img[@class = 'errorOops']|id('oops'))", d),
			errmsg	: xpath("string(.//div[@class = 'errorMessage']/text())", d),
			body	: d,
		};
	},
	parseText = function (text, format) {
		switch (format) {
			case "query":
				var params = {},
				tmp,
				re = /(\w+)=(.+?)(?:&|$)/g;
				while (tmp = re.exec(text)) {
					params[tmp[1]] = decodeURIComponent(tmp[2]).replace(/\+/g, " ");
				}
				return params;
		}
		return text;
	};
	
	this.request = function (obj) {
		if (obj.ck) {
			if (!obj.data) {
				obj.data = {};
			}
			obj.data[obj.ck] = this.ck;
		}

		var req = HttpRequest.open({
			method		: obj.method || "post",
			url			: obj.action,
			headers		: {
				Referer	: obj.referer || obj.action,
			},
			onsuccess	: function (xhr) {
				var format = (obj.format || "xml").toLowerCase(),
				_doc = xhr.response[~["xml", "json"].indexOf(format)?format:"text"],
				data;
				if ("xml" == format) {
					data = processDocument(_doc);

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
				} else {
					var json = ("json" == format?_doc:parseText(_doc, format)),
					err = 0 == json.success;

					data = {
						error	: err,
						errmsg	: (err?json.msg:""),
						body	: json,
					};
				}

				obj.callback(data);
			}
		});
		
		if (obj.delay) {
			var d = (obj.delay instanceof Array?obj.delay:this.delay);
			return setTimeout(function () {
				req.send(obj.data);
			}, d[0] + Math.floor(d[1] * Math.random()));
		} else {
			return req.send(obj.data);
		}
	};

	if (contentTime) {
		var re = /var n([hms]) = (\w+)/g,
		isPm = /var na = "(\w+)/.test(contentTime) && "pm" == RegExp.$1,
		staticTime = {};

		while (re.exec(contentTime)) {
			staticTime[RegExp.$1] = parseInt(RegExp.$2, 10);
		}

		var h = (staticTime.h % 12) + (12 * isPm);
		createdAt = new Date(Date.UTC(
			createdAt.getUTCFullYear(),
			createdAt.getUTCMonth(),
			createdAt.getUTCDate() - (h - createdAt.getUTCHours() > 24 - h),
			h,
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

		if ("events" == type) {
			this.document = doc;
		}
	};
	
	this.getTime = function () {
		return new Date(Date.now() - diff);
	};
	
	this.getDocument = function () {
		return processDocument(doc);
	};

	Object.defineProperties(this, {
		staticTime	: {
			value	: createdAt,
		},
		time		: {
			get		: this.getTime,
		},
		username	: {
			get		: function () {
				return (/([^=]+)$/.test(_s("id('header')//a[contains(@href, '?user=')]/@href")) && RegExp.$1 || "");
			},
		},
		document	: {
			get		: function () {
				return doc;
			},
			set		: function (value) {
				doc = value;

				var np = _n("id('header')//td/a[contains(@href, 'inventory')]/text()"),
				_refck = _s(".//*[(@name = '_ref_ck' or @name = 'ck') and string-length(@value) = 32]/@value") || (/_ref_ck=(\w{32})/.test(_s(".//*[contains(@href, '_ref_ck')]/@href"))?RegExp.$1:""),
				listen = [
					["events", _b(".//div[@class = 'randomEvent']/div[@class = 'copy']|.//div[@class = 'inner_wrapper2']/img[@class = 'item']|.//table[@width = '400']/tbody[tr[1]/td[@colspan = '2']]/tr[2][td[1]/img and td[2]]")],
				],
				data = {
					error	: _b(".//img[@class = 'errorOops']|id('oops')"),
					errmsg	: _s(".//div[@class = 'errorMessage']/text()"),
					body	: doc,
				};

				np && (this.np = np);
				_refck && this.setUserData("ck", _refck);

				if (data.error && / pin /.test(data.errmsg.toLowerCase())) {
					GM_deleteValue(this.username + "-pinNumber");
				}

				for (var ai in listen) {
					var l = listen[ai];
					if (l[1] && l[0] in _listeners) {
						data.result = this[l[0]];
						for (var bi = 0, bt = _listeners[l[0]].length;bi < bt;++bi) {
							_listeners[l[0]][bi](data);
						}
					}
				}
			},
		},
		pin			: {
			get		: function () {
				var pinUserKey = this.username + "-pinNumber",
				pin = GM_getValue(pinUserKey, undefined);

				if (typeof pin != "string") {
					var pinTmp;
					if (typeof (pinTmp = prompt("Pin Number:")) == "string") {
						GM_setValue(pinUserKey, pin = pinTmp);
					} else {
						throw "pin_number is required.";
					}
				}

				return pin;
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
		delay		: {
			writable: true,
			value	: [834, 363],
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
					stats	: {
						get : function () {
							var o = {};

							Object.defineProperties(o, {
								level	: {
									get	: function () {
										return _n(".//td[@class = 'activePetInfo']//tr[6]/td[2]/descendant::text()");
									},
								},
								endurance: {
									get	: function () {
										return parseInt(_s(".//td[@class = 'activePetInfo']//tr[2]/td[2]/descendant::text()").split(/\s+\/\s+/)[1].replace(/[,.]/g, ""), 10) || 0;
									},
								},
							});

							return o;
						},
					},
					health	: {
						get	: function () {
							return _s(".//td[@class = 'activePetInfo']//tr[2]/td[2]/descendant::text()").split(/\s+\/\s+/).map(function (v) {
								return parseInt(v.replace(/[,.]/g, ""), 10) || 0;
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
			/*
<table width="400" align="center">
	<tbody><tr>
		<td width="400" bgcolor="#ffffcc" align="center" cellpadding="3" colspan="2"><b>Something has happened!</b></td>
	</tr>
	<tr>
		<td width="80"><img width="80" height="80" border="1" src="http://images.neopets.com/items/hall_petpet1.gif"></td>
		<td width="320">You have received <strong>50 Neopoints</strong> from what seems to be a very rich Slorg.  That was nice of him.  Anyway, thanks for visiting the Shop of Offers today!  *triumphant music*<br></td>
	</tr>
</tbody></table>
			*/
				return xpath(".//div[@class = 'inner_wrapper2']/img[@class = 'item']", doc).map(function (item) {
					return {
						icon	: item.previousElementSibling.getAttribute("src"),
						item	: {
							name	: xpath("string(./b)", item.nextElementSibling),
							image	: item.getAttribute("src"),
						},
						message	: item.nextElementSibling.textContent.trim(),
					};
				}).concat(xpath(".//div[@class = 'randomEvent']/div[@class = 'copy']", doc).map(function (item) {
					return {
						icon	: undefined,
						item	: {},
						message	: item.textContent.trim(),
					};
				})).concat(xpath(".//table[@width = '400']/tbody[tr[1]/td[@colspan = '2']]/tr[2][td[1]/img and td[2]]", doc).map(function (item) {
					return {
						icon	: item.previousElementSibling.cells[0].getAttribute("bgcolor"),
						item	: {
							name	: xpath("string(./b)", item.cells[1]),
							image	: item.cells[0].firstElementChild.getAttribute("src"),
						},
						message	: item.cells[1].textContent.trim(),
					};
				}));
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
		premium		: {
			value	: _b("id('superfooter')"),
		},
	});
	
	this.format = function (value) {
		return ("" + value).replace(/[.]/g, _punct[0]).replace(/\d(?=(?:\d{3})+(?:\D|$))/g, "$&" + _punct[1]);
	};
	
	var userKey = "neopets-" + this.username,
	_userTmp = JSON.parse(GM_getValue(userKey, "{}"));
	
	this.getUserData = function (k) {
		return _userTmp[k];
	};
	
	this.setUserData = function (k, v) {
		_userTmp[k] = v;
		GM_setValue(userKey, JSON.stringify(_userTmp));
	};
	
	this.document = doc;
};
