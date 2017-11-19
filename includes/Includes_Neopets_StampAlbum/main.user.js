// ==UserScript==
// @name           Includes : Neopets : StampAlbum
// @namespace      br.eti.wesley
// @description    StampAlbum Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2015+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0
// @language       en
// @include        nowhere
// @exclude        *
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @require        https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
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

var StampAlbum = function (page) {
	var _this = this,
	_merge = function (data, def) {
		var tmp = def || {};
		for (var k in data) {
			tmp[k] = data[k];
		}
		return tmp;
	},
	_response = function (xhr, p, cb) {
    	Object.defineProperties(xhr, {
    		response	: {
    			get	: function () {
    				return p(xhr);
    			}
    		}
    	});

    	cb(xhr);
    },
    _get = function (data, p, cb) {
		page.request({
        	method   : "get",
        	action   : "http://www.neopets.com/stamps.phtml",
        	delay    : true,
        	data     : data,
        	callback : function (xhr) {
        		_response(xhr, p, cb);
        	}
		});
	},
	_cached = {};

	this.compare = function (obj) {
		if (!obj.data || !obj.data.owner) {
			throw "obj.data.owner is required";
		}
		var pages = [];
		
		(function recursive (p, max) {
			_this.album({
				data	: {
					page_id	: p,
					owner	: obj.data.owner
				},
				callback: function (xhr) {
					pages.push(xhr);
					max = xpath("count(.//td[@class = 'content']//p/a[contains(@href, 'page_id')]/b)", xhr.body);

					if (++p < max) {
						recursive(p, max);
					} else {
						_response({}, function () {
							return {
								albums	: pages
							};
						}, obj.callback);
					}
				}
			})
		}(1, 39));
	};

	this.album = function (obj) {
		var data = _merge(obj.data || {}, {
			type	: "album",
			page_id	: 0,
			owner	: ""
		});

		if (!(data.owner in _cached)) {
			_cached[data.owner] = {};
		}
		if (obj.cache !== false && data.page_id in _cached[data.owner]) {
			obj.callback(_cached[data.owner][data.page_id]);
		} else {
			_get(data, function (xhr) {
				var s = 0;
				return {
					id		: parseInt(data.page_id, 10) || 0,
					owner	: xpath("string(.//td[@class = 'content']//p/b/a[contains(@href, 'randomfriend')]/b/text())", xhr.body),
					name	: xpath("string(.//td[@class = 'content']//table/tbody/tr/td/b/text())", xhr.body).replace(/-\s+|\s+-/g, ""),
					stamps	: xpath(".//td[@class = 'content']//table/tbody/tr/td/img", xhr.body).map(function (o) {
						if (!~o.getAttribute("src").indexOf("no_stamp")) {
							++s;
						}
	
						return {
							position	: [o.parentNode.cellIndex, o.parentNode.parentNode.rowIndex - 1],
							name		: o.getAttribute("title"),
							image		: o.getAttribute("src")
						};
					}),
					total	: s
				};
			}, function (xhr) {
				_cached[data.owner][data.page_id] = xhr;

				if (data.owner) {
					xhr.compare = function (cb) {
						_this.album({
							cache	: obj.cache,
							data	: {
								page_id	: data.page_id
							},
							callback: function (xhr2) {
								_response({}, function () {
									var r = _merge(xhr.response, {}),
									r2 = xhr2.response;

									r.stamps = r.stamps.map(function (o, i) {
										var xx = !~o.image.indexOf("no_stamp"),
										x = (xx?o:r2.stamps[i]);
										x.found = xx | !~r2.stamps[i].image.indexOf("no_stamp") << 1;

										return x;
									});

									return r;
								}, cb);
							}
						});
					};
				}
	
				obj.callback(xhr);
			});
		}
	};
	
	this.overview = function (obj) {
		_get({
			type	: "progress"
		}, function (xhr) {
			return {
				albums	: xpath(".//td[@class = 'content']//table/tbody/tr/td[a/b]", xhr.body).map(function (o) {
					return {
						id		: /page_id=(\d+)/.test(o.firstElementChild.getAttribute("href")) && parseInt(RegExp.$1, 10),
						name	: o.textContent.trim(),
						total	: parseInt(o.parentNode.cells[2].textContent.trim(), 10)
					}
				}),
				total	: parseInt(xpath("string(.//td[@class = 'content']//p[position() = last()]/b/text())", xhr.body), 10)
			};
		}, obj.callback);
	};
};