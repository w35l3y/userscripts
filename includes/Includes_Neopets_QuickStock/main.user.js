// ==UserScript==
// @name        Includes : Neopets : QuickStock
// @namespace   http://gm.wesley.eti.br
// @description QuickStock Function
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

var QuickStock = function (page) {
    var _parse = function (xhr, obj) {
    	Object.defineProperties(xhr, {
    		response: {
    			get	: function () {
					return {
			    		items	: xpath(".//td[@class = 'content']//tr[.//input[contains(@name, 'radio_arr')]]", xhr.body).map(function (item) {
			    			var inputs = xpath(".//input[@type = 'radio']", item),
			    			id = xpath(".//input[starts-with(@name, 'id_arr[')]", item)[0];

			    			return {
			    				is_nc	: !id,
			    				obj_id	: id && id.value || /\[(\d+)\]/.test(inputs[0].name) && RegExp.$1 || undefined,
			    				name	: item.cells[0].textContent.trim(),
			    				options	: inputs.map(function (radio) {
			    					return radio.value;
			    				})
			    			};
			    		})
			    	};
    			}
    		}
    	});

    	obj.callback(xhr);
    },
	_get = function (cb) {
		page.request({
            method   : "get",
            action   : "http://www.neopets.com/quickstock.phtml",
            delay    : true,
            data     : {},
            callback : cb
        });
    },
    _post = function (data, cb) {
        page.request({
           method   : "post",
           action   : "http://www.neopets.com/process_quickstock.phtml",
           referer  : "http://www.neopets.com/quickstock.phtml",
           delay    : true,
           data     : data,
           callback : cb
        });
    },
    _this = this;

    this.list = function (obj) {
    	_get(function (xhr) {
    		_parse(xhr, obj);
    	});
    };

    this.process = function (obj) {
    	if (!obj.action) {
    		throw "obj.action is required";
    	} else if (!obj.items || !obj.items.length) {
    		_this.list({
    			callback	: function (xhr) {
    				obj.items = xhr.response.items;

    				if (obj.items.length) {
        				_this.process(obj);
    				} else {
    					_parse(xhr, obj);
    				}
    			}
    		});
    	} else {
    		(function recursive (xhr, items) {
    			if (items.length) {
    				var data = {},
    				count = 0,
    				limitedList = items.slice(0, 70);

    				for (var item of limitedList) {
    					var action = item.action || obj.action;

    					if (item.is_nc) {
    						data["cash_radio_arr[" + item.obj_id + "]"] = action;
    					} else {
    						data["id_arr[" + (++count) + "]"] = item.obj_id;
    						data["radio_arr[" + (count) + "]"] = action;
    					}
    				}

    				_post(data, function (xhr) {
                		recursive(xhr, items.slice(70));
                	});
    			} else {
    				_parse(xhr, obj);
    			}
    		}({}, obj.items.filter(function (item) {
    			return (!item.options || item.options.indexOf(obj.action));
    		})));
    	}
    };
};