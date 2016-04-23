// ==UserScript==
// @name        Includes : Neopets : Auctions
// @namespace   github.com
// @description Auctions Function
// @author      jacobkossman
// @email       jacob.kossman@gmail.com
// @copyright   2016+, jacobkossman
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
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_[BETA]/main.user.js
// @contributor w35l3y
// ==/UserScript==

var Auctions = function (page) {
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
	_post_genie = function (data, p, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/genie.phtml",
			referer	: "http://www.neopets.com/genie.phtml",
			data	: data,
			delay	: true,
            callback : function (xhr) {
           	    p && _response(xhr, p);
           	    cb(xhr);
		    }
		});
    },
	_post = function (data, p, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/auctions.phtml",
			referer	: "http://www.neopets.com/auctions.phtml?type=bids&auction_id=" + data.auction_id,
			data	: data,
			ck		: "_ref_ck",
			delay	: true,
            callback : function (xhr) {
           	    p && _response(xhr, p);
           	    cb(xhr);
		    }
		});
    },
    _get = function (data, p, cb) {
        page.request({
            method   : "get",
            action   : "http://www.neopets.com/auctions.phtml",
            data     : data,
            delay    : true,
            callback : function (xhr) {
				var oops = xpath("string(.//td[@class = 'content']/center[2]/p[b and not(img) and text()])", xhr.body);
				if (oops) {
					xhr.error = true;
					xhr.errmsg = oops;
				}
           	    p && _response(xhr, p);
           	    cb(xhr);
		    }
        });
    };

	this.parse = function (type, doc) {
		if (!doc) {
			doc = page.document;
		}

		var _n = function (v, d) {
			return parseInt(xpath(v, d || doc).replace(/\D+/g, ""), 10);
		};

		switch (type) {
			case "auctions":
			case "genie":
				return {
					list	: xpath(".//td[@class = 'content']//table//tbody/tr[td[8]]", doc).map(function (row) {
						return {
							id           : /\bauction_id=(\d+)/.test(xpath("string(td[3]/a/@href)", row)) && parseInt(RegExp.$1, 10),
							item         : {
								image        : xpath("string(./td[2]/a/img/@src)", row),
								name         : xpath("string(./td[3]/a/text())", row),
							},
							owner        : xpath("string(./td[4]/font/text())", row),
							nf_only		 : xpath("boolean(./td[4]/b)", row),
							timeleft     : xpath("string(./td[5]/b/font/text())", row),
							currentprice : _n("string(./td[7]/b/text())", row),
							closed       : false,
							lastbid      : _n("string(./td[6]/b/text())", row),
							lastbidder   : (xpath("boolean(./td[8]/a/img)", row)?xpath("string(./td[8]/font/text())", row):""),
						}
					})
				};
			case "bids":
				var item = /([^\(]+).+?(\w+)\)/.test(xpath("string(.//td[@class = 'content']//p[1]/b)", doc)) && [RegExp.$1, RegExp.$2] || [""],
				o = {
					id		: _n("string(.//td[@class ='content']/p[2]/b)"),
					item	: {
						name	: item[0].trim(),
						image	: xpath("string(.//td[@class = 'content']//p[1]/img/@src)", doc),
						description: xpath("string(.//td[@class = 'content']/center[2]/p[1]/text())", doc),
					},
					owner	: item[1],
					nf_only	: xpath("boolean(.//td[@class = 'content']/p/span/b)", doc),
					timeleft: xpath("string(.//td[@class = 'content']/center[2]/text())", doc).trim(),
					increment: _n("string(.//td[@class = 'content']/p[3]/b[position() = last()])"),
					currentprice	: _n("string(.//td[@class = 'content']//form//input[@name = 'amount']/@value)"),
					list	: xpath(".//td[@class = 'content']//table/tbody/tr[td[1]/a/img]", doc).map(function (bid) {
						return {
							bidder : xpath("string(td[1])", bid).trim(),
							amount : parseInt(xpath("string(td[2]/b)", bid).replace(/\D+/g, ""), 10),
							when   : xpath("string(td[3])", bid).trim()
						};
					}),
				};
				o.closed = !o.currentprice;
				o.lastbid = (o.list.length?o.list[0].amount:(o.currentprice - o.increment));
				o.lastbidder = (o.list.length?o.list[0].bidder:"");
				
				return o;
			case "placebid":
				var msg = xpath(".//td[@class = 'content']/center[2]/p/font", doc)[0];

				return msg?{
					success	: ("green" == msg.getAttribute("color"))
					text	: msg.textContent.trim()
				}:{
					success	: false,
					text	: ""
				};
			default:
				throw "Unknown type: " + type
		}
	};

	this.bid = function (obj) {
		_post({
			type		: "placebid",
			auction_id	: obj.id || obj.auction.id
			amount		: obj.value || obj.auction.currentprice,
		}, function (o) {
			return _this.parse("placebid", o.body);
		}, obj.callback);
	};

    this.bids = function (obj) {
        _get({
			"type"			: "bids",
			"auction_id"	: obj.id || obj.auction.id
		}, function (o) {
			return _this.parse("bids", o.body);
        }, obj.callback);
    };

    this.auctions = function (obj) {
		var list = [];
		(function recursive (page) {
			_get(Object.assign({
				"auction_counter"	: 20 * page,
			}, obj.data), null, function (o) {
				var result = _this.parse("auctions", o.body);
				Array.prototype.push.apply(list, result.list);

				if (obj.all && 20 == result.list.length) {
					recursive(++page);
				} else {
					_response(o, function () {
						return {
							list	: list
						}
					});

					obj.callback(o);
				}
			});
		}(obj.page || 0));
    };

	this.mine = function (obj) {
		_this.auctions({
			all		: true,
			data	: {
				show	: "mine"
			},
			callback	: obj.callback
		});
	};

	this.leading = function (obj) {
		_this.auctions({
			all		: true,
			data	: {
				type	: "leading"
			},
			callback	: obj.callback
		});
	};

	this.search = function (obj) {
		_post_genie(Object.assign(("username" == obj.type?{
			type	: "find_user",
			auction_username: obj.value || page.username || "",
		}:{
			type		: "process_genie",
			auctiongenie: obj.value || "",
			criteria	: "exact",
			exclude_nf_only: "On",
		}), obj.data), function (o) {
			return _this.parse("genie", o.body);
		}, obj.callback);
	};
};
