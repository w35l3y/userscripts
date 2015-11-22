// ==UserScript==
// @name        Includes : Neopets : StockMarket
// @namespace   http://gm.wesley.eti.br
// @description StockMarket Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @require     https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
// ==/UserScript==

var StockMarket = function (page) {
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
	_post = function (data, p, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/process_stockmarket.phtml",
			referer	: "http://www.neopets.com/stockmarket.phtml",
			ck		: "_ref_ck",
			data	: data,
			delay	: true,
			callback: function (xhr) {
				p && _response(xhr, p);
				cb(xhr);
			}
		});
	},
	_get = function (data, p, cb) {
		page.request({
			method	: "get",
			action	: "http://www.neopets.com/stockmarket.phtml",
			data	: data,
			delay	: true,
			callback: function (xhr) {
				p && _response(xhr, p);
				cb(xhr);
			}
		});
	},
	_n = function (v) {
		return parseInt(v.textContent, 10);
	},
	Portfolio = function () {
		var _thisPortfolio = this;

		this.parse = function (xhr) {
			var shares = [],
			total = xpath("id('postForm')/table[1]/tbody/tr[position() = last()]", xhr.body)[0].cells;

			xpath("id('postForm')/table/tbody/tr/td[1]/img[2]", xhr.body).forEach(function (o) {
				var cells = o.parentNode.parentNode.cells,
				d = {
					id		: /^(\d+)/.test(o.previousElementSibling.id) && parseInt(RegExp.$1),
					image	: o.getAttribute("src"),
					ticker	: cells[1].firstElementChild.textContent,
					company	: o.getAttribute("title"),
					open	: _n(cells[2]),
					curr	: _n(cells[3]),
					qty		: _n(cells[5]),
					paid	: _n(cells[6])
				},
				s = xpath(".//tr/td/input", o.parentNode.parentNode.nextElementSibling).map(function (x) {
					var n = x.getAttribute("name"),
					ec = x.parentNode.parentNode.cells;

					return {
						id		: /\[(\d+)\]$/.test(n) && parseInt(RegExp.$1, 10),
						name	: n,
						shares	: _n(ec[0]),
						paid	: _n(ec[1]),
						total	: _n(ec[2]),
						company	: d
					};
				}).sort(function (a, b) {
					return -(a.paid < b.paid) || +(a.paid != b.paid)
						|| -(a.shares > b.shares) || +(a.shares != b.shares);
				});
				d.group = /stockmarket\/(\d+)\./.test(d.image) && parseInt(RegExp.$1, 10);
				d.change = (d.curr / d.open) - 1;

				Array.prototype.push.apply(shares, s);
			}); 

			return {
				shares	: shares,
				total	: {
					qty		: _n(total[1]),
					paid	: _n(total[2]),
					value	: _n(total[3])
				}
			};
		};
		
		this.execute = function (cb) {
			_get({
				type	: "portfolio"
			}, _thisPortfolio.parse, cb);
		};
	};

	this.stocks = function (obj) {
		var data = {
			type	: "list",
		};

		if (obj.is_bargain) {
			data.bargain = true;
		} else {
			data.full = true;
		}

		_get(data, function (xhr) {
			return {
				list	: xpath(".//td[@class = 'content']//table/tbody/tr/td[a/b]", xhr.body).map(function (o) {
					var cells = o.parentNode.cells,
					d = {
						id		: /&company_id=(\d+)/.test(o.firstElementChild.getAttribute("href")) && parseInt(RegExp.$1, 10),
						image	: cells[0].getAttribute("src"),
						ticker	: o.textContent,
						company	: cells[2].textContent,
						volume	: _n(cells[3]),
						open	: _n(cells[4]),
						curr	: _n(cells[5])
					};
					d.group = /stockmarket\/(\d+)\./.test(d.image) && parseInt(RegExp.$1, 10);
					d.change = (d.curr / d.open) - 1;

					return d; 
				})
			}
		}, obj.callback);
	};
	
	this.portfolio = function (obj) {
		new Portfolio().execute(obj.callback);
	};
	
	this.buy = function (obj) {
		if (!obj.data || obj.data.ticker) {
			throw "obj.data.ticker is required";
		} else if (!obj.data.amount || 0 < obj.data.amount) {
			_post({
				type			: "buy",
				ticker_symbol	: obj.data.ticker,
				amount_shares	: obj.data.amount || 1000
			}, function (xhr) {
				return new Portfolio().parse(xhr);
			}, obj.callback);
		} else {
			throw "obj.data.amount must be greater than zero";
		} 
	};
	
	this.sell = function (obj) {
		_this.portfolio({
			callback	: function (xhr) {
				var list = xhr.response.shares;

				if (list.length) {
					var data = {
							type			: "sell",
							pin				: page.pin
					};

					list.filter(function (o) {
						return (!obj.list || !obj.list.length || obj.list.some(function (x) {
							if (x.ticker == o.company.ticker && (!x.id || x.id == o.id) && 0 <= x.amount) {
								var a = Math.min(o.shares, x.amount);
								x.amount -= a;
								o.shares -= o.shares - a;

								return o.shares;
							}

							return false;
						}));
					}).forEach(function (value) {
						data[value.name] = value.shares;
					});

					_post(data, function (xhr) {
						return {
							transactions	: xpath(".//center/table/tbody/tr[1 < position()]", xhr.body).map(function (o) {
								return o.cells[2].textContent;
							})
						};
					}, obj.callback);
				} else {
					obj.callback(xhr);
				}
			}
		});
	};
};