// ==UserScript==
// @name        Includes : Neopets : TradingPost
// @namespace   http://gm.wesley.eti.br
// @description TradingPost Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2016+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @require     https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require     ../../includes/Includes_XPath/63808.user.js
// @require     ../../includes/Includes_HttpRequest/56489.user.js
// @require     ../../includes/Includes_Neopets_[BETA]/main.user.js
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

(function (context) {
"use strict";

	context.TradingPost = function (page) {
		var item = function (node) {
			return {
				image		: node.getAttribute("src"),
				name		: node.nextSibling.textContent.trim(),
				description	: node.getAttribute("alt")
			};
		};

		this.parse = function (type, doc = page.document) {
			var _n = function (v) {
				return parseInt(v.replace(/\D+/g, ""), 10);
			};

			switch (type) {
				case "viewmyoffers":
				return {
					list	: xpath(".//td[@class = 'content']//td//td//tr[1]/td/a", doc).map(function (node) {
						var itemsRow = node.parentNode.parentNode.nextElementSibling.cells;
						return {
							id		: _n(node.parentNode.previousElementSibling.textContent),
							items	: xpath("./img", itemsRow[0]).map(item)
							lot		: {
								id		: _n(node.parentNode.firstElementChild.textContent),
								owner	: node.textContent,
								items	: xpath("./img", itemsRow[1]).map(item)
							}
						};
					})
				};
				case "view":
				case "browse":
				case "makeoffer":
				case "viewoffers":
				default:
				return {
					list	: xpath(".//td[@class = 'content']/div/table/tbody/tr/td/table/tbody/tr/td/b", doc).map(function (node) {
						var found = true;
						return Object.assign({
							id		: _n(node.textContent),
							wishlist: xpath("string(./following-sibling::p[1]/text()[1])", node).trim(),
							items	: xpath("./following-sibling::table[1]//img", node).concat(xpath("./following-sibling::img[position() <= 10]|./following-sibling::hr[1]", node).filter(function (item) {
								return found && (found = !item.tagName.toUpperCase().indexOf("IMG"));
							})).map(item)
						}, (~(node.nextElementSibling.getAttribute("src") || "").indexOf("viewoffers&lot_id")?{
							user	: page.username,
							offers	: _n(node.nextElementSibling.textContent)
						}:{
							user	: node.nextElementSibling.textContent.trim(),
							offers	: 0
						}));
					})
				};
			}
		};
		
		var _self = this,
		_post = function (data, cb) {
			page.request({
				method	: "post",
				action	: "http://www.neopets.com/island/tradingpost.phtml",
				referer	: "http://www.neopets.com/island/tradingpost.phtml",
				data	: data,
				delay	: true,
				callback: function (o) {
					Object.defineProperties(o, {
						result : {
							get	: function () {
								return _self.parse(data.type, o.body);
							}
						}
					});

					cb(o);
				}
			});
		},
		_get = function (data, cb) {
			page.request({
				method	: "get",
				action	: "http://www.neopets.com/island/tradingpost.phtml",
				referer	: "http://www.neopets.com/island/tradingpost.phtml",
				data	: data,
				delay	: true,
				callback: function (o) {
					Object.defineProperties(o, {
						result : {
							get	: function () {
								return parse(data.type, o.body);
							}
						}
					});

					cb(o);
				}
			});
		};
		
		this.view = function (obj) {
			_get({
				type	: "view"
			}, obj.callback);
		};

		this.makeOffer = function (obj) {
			page.request({
				method	: "post",
				action	: "http://www.neopets.com/island/process_tradingpost.phtml",
				referer	: "http://www.neopets.com/island/tradingpost.phtml",
				ck		: "_ref_ck",
				data	: Object.assign({
					lot_id			: obj.id || "",
					selected_items	: [],
					neopoints		: 0
				}, obj.data, {
					type	: "makeoffer"
				}),
				delay	: true,
				callback: function (o) {
					Object.defineProperties(o, {
						result : {
							get	: function () {
								return _self.parse("makeoffer", o.body);
							}
						}
					});

					obj.callback(o);
				}
			});
		};
		
		this.viewOffers = function (obj) {
			_get(Object.assign({
				lot_id	: obj.id || ""
			}, obj.data, {
				type	: "viewoffers"
			}), obj.callback, function (d) {
				
			});
		};
		
		this.myOffers = function (obj) {
			_get({
				type	: "viewmyoffers"
			}, obj.callback);
		};
		
		this.browse = function (obj) {
			var data = Object.assign({
				criteria		: context.TradingPost.Criteria.EXACT,
				search_string	: obj.value || "",
				sort_by			: context.TradingPost.Sort.NEWEST,
				offset			: 0,
				limit			: 20
			}, obj.data, {
				type	: "browse"
			}),
			responses = [];

			(function recursive (offset) {
				data.offset = offset;

				_post(data, function (o) {
					if (obj.all) {
						if (/offset=(\d+)/.test(xpath("string(.//td[@class = 'content']//tr//tr[position() = last()]//tr/td[@align = 'right']/a/@href)", o.body))) {
							responses.push(o);
							recursive(RegExp.$1);
						} else {
							var x = {};
							Object.defineProperties(x, {
								result	: {
									get	: function () {
										return {
											list : Array.prototype.concat.apply([], responses.map(function (r) {
												return r.result.list;
											}))
										}
									}
								}
							});

							obj.callback(x);
						}
					} else {
						obj.callback(o);
					}
				});
			}(0));
		};
		
		this.newest = function (obj) {
			var x = Object.assign({}, obj);
			x.data = {
				criteria	: context.TradingPost.Criteria.NEWEST
			};

			_self.browse(x);
		};
	};
	
	context.TradingPost.Criteria = {};
	Object.defineProperties(context.TradingPost.Criteria, {
		NEWEST	: {value:"20"},
		CONTAIN	: {value:"item_phrase"},
		EXACT	: {value:"item_exact"},
		OWNER	: {value:"owner"},
		ID		: {value:"id"}
	});

	context.TradingPost.Sort = {};
	Object.defineProperties(context.TradingPost.Sort, {
		NEWEST	: {value:"newest"},
		RANDOM	: {value:"random"},
		OLDEST	: {value:"oldest"}
	});
}(this));
