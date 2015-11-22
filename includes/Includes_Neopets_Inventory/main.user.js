// ==UserScript==
// @name        Includes : Neopets : Inventory
// @namespace   http://gm.wesley.eti.br
// @description Inventory Function
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
// @require     https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
// ==/UserScript==

var Inventory = function (page) {
	var _response = function (xhr, p, cb) {
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
        	action   : "http://www.neopets.com/iteminfo.phtml",
        	referer  : "http://www.neopets.com/inventory.phtml",
        	delay    : true,
        	data     : data,
        	callback : function (xhr) {
        		_response(xhr, p, cb);
        	}
    	});
	},
	_post = function (data, p, cb) {
        if (!data || !data.obj_id) {
        	throw "data.obj_id is required";
        } else if (!data.action) {
        	throw "data.action is required";
        }

        if (data.is_nc || data.gucid) {
        	if (!data.gucid) {
            	throw "data.gucid is required";
        	} else if (data.is_giftbox) {
        		throw "Not implemented yet";
        	}

        	page.request({
    			method	 : "post",
    			action	 : "http://www.neopets.com/process_cash_object.phtml",
    			referer  : "http://www.neopets.com/" + (data.is_giftbox?"ncmall/box":"item") + "info.phtml?cash_obj_id=" + data.obj_id + "&gucid=" + data.gucid + "&habitat=" + (data.is_habitat?1:0),
    			delay    : true,
    			data	 : {
    				cash_obj_id	: data.obj_id,
    				action		: data.action
    			},
    			callback : function (xhr) {
            		_response(xhr, p, cb);
    			}
    		});
        } else {
    		page.request({
    			method	 : "post",
    			action	 : "http://www.neopets.com/useobject.phtml",
    			referer  : "http://www.neopets.com/iteminfo.phtml?obj_id=" + data.obj_id,
    			delay    : true,
    			data	 : data,
    			callback : function (xhr) {
            		_response(xhr, p, cb);
    			}
    		});
        }
	},
	_merge = function (data, def) {
		var tmp = def || {};
		for (var k in data) {
			tmp[k] = data[k];
		}
		return tmp;
	};
	
	this.use = function (obj) {
		_post(_merge(obj.data || {}, {
			obj_id	: obj.obj_id || "",
			action	: ""
		}), function (xhr) {
			throw "Not implemented yet";
		}, obj.callback);
	};
	
	this.auction = function (obj) {
    	if (!obj.obj_id && (!obj.data || !obj.data.obj_id)) {
    		throw "obj.obj_id is required";
    	}

		page.request({
			method	 : "post",
			action	 : "http://www.neopets.com/add_auction.phtml",
			referer  : "http://www.neopets.com/useobject.phtml",
			delay    : true,
			data	 : _merge(obj.data || {}, {
							obj_id			: obj.obj_id || "",
							start_price		: 1,
							min_increment	: 1,
							duration		: 1
						}),
			callback : function (xhr) {
        		_response(xhr, function (xhr) {
					throw "Not implemented yet";
				}, obj.callback);
			}
		});
	};

    this.info = function (obj) {
    	if (!obj.obj_id && (!obj.data || !obj.data.obj_id)) {
    		throw "obj.obj_id is required";
    	}

    	_get(_merge(obj.data || {}, {
			obj_id	: obj.obj_id || "",
    	}), function (xhr) {
    		throw "Not implemented yet";
			return {
	 			item	: {
	 				is_nc		: false,
					obj_id		: "",
	 				name		: "",
	 				image		: "",
	 				description	: "",
	 				info		: {}
	 			}
	 		};
		}, obj.callback);
    };

	this.list = function (obj) {
		page.request({
			method	 : "get",
			action	 : "http://www.neopets.com/inventory.phtml",
			delay	 : true,
			data     : {},
			callback : function (xhr) {
				_response(xhr, function () {
					return {
						items	: xpath(".//td[@class = 'content']//td/a/img", xhr.body).map(function (item) {
							var name = item.parentNode.nextSibling.nextSibling.textContent.trim(),
							categories = xpath("./ancestor::td[1]//span[@style]", item).map(function (category) {
								return {
									name	: category.textContent.trim().replace(/^\(|\)$/g, ""),
									color	: category.getAttribute("style").replace(/^color: |;$/g, "")
								};
							}),
							onclick = item.parentNode.getAttribute("onclick");

							if (/openwin\((\d+)\)/.test(onclick)) {
								return {
									is_nc		: false,
									obj_id		: RegExp.$1,
									is_habitat	: false,
									is_giftbox	: false,
									name		: name,
									image		: item.src,
									description	: item.title,
									categories	: categories
								};
							} else if (/cash_win\((\d+), "(\w+)", "", (\w+), (\w+)\)/.test(onclick)) {
								return {
									is_nc		: true,
									obj_id		: RegExp.$1,
									gucid		: RegExp.$2,
									is_habitat	: "true" == RegExp.$3,
									is_giftbox	: "true" == RegExp.$4,
									name		: name,
									image		: item.src,
									description	: item.title,
									categories	: categories
								};
							} else {
								console.warn(name, onclick);
							}
						}).filter(function (item) {
							return item;
						})
					};
				}, obj.callback);
			}
		});
	};
};