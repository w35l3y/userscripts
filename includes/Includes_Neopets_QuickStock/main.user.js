// ==UserScript==
// @name		Includes : Neopets : QuickStock
// @namespace	http://gm.wesley.eti.br
// @description	QuickStock Function
// @author		w35l3y
// @email		w35l3y@brasnet.org
// @copyright	2015+, w35l3y (http://gm.wesley.eti.br)
// @license		GNU GPL
// @homepage	http://gm.wesley.eti.br
// @version		1.1.1
// @language	en
// @include		nowhere
// @exclude		*
// @grant		GM_xmlhttpRequest
// @require		https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
// @require		https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require		https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require		https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
// ==/UserScript==

var QuickStock = function (page) {
	var _msg = new page.messages(),
	_parse = function (xhr, obj) {
		Object.defineProperties(xhr, {
			response: {
				get	: function () {
					return {
						items	: xpath(".//td[@class = 'content']//tr[.//input[contains(@name, 'radio_arr')]]", xhr.body).map(function (item) {
							var inputs = xpath(".//input[@type = 'radio']", item),
							id = xpath(".//input[starts-with(@name, 'id_arr[')]", item)[0],
							action = (item.querySelector("input[name *= 'radio_arr']:checked")||{value:""}).value;

							return {
								is_nc	: !id,
								obj_id	: id && id.value || /\[(\d+)\]/.test(inputs[0].name) && RegExp.$1 || undefined,
								action	: action,
								is_normal	: (action?!!~["stock", "deposit", "donate", "discard", "gallery", "closet", "storage_shed"].indexOf(action):undefined),
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

		obj && obj.callback(xhr);
		return xhr;
	},
	_get = function (cb) {
		page.request({
			method   : "get",
			action   : "http://www.neopets.com/quickstock.phtml",
			delay	: true,
			data	 : {},
			callback : cb
		});
	},
	_post = function (data, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/process_quickstock.phtml",
			referer	: "http://www.neopets.com/quickstock.phtml",
			delay	: true,
			data	: data,
			callback: cb
		});
	},
	_this = this,
	_actions = {};

	this.add = function (action, cb) {
		_actions[action] = cb;
	};

	this.parse = function () {
		return _parse({
			body	: page.document
		}).response;
	};

	this.list = function (obj) {
		_get(function (xhr) {
			_parse(xhr, obj);
		});
	};

	this.process = function (obj) {
		if (obj.action && (!obj.items || !obj.items.length)) {
			_this.list({
				callback	: function (xhr) {
					obj.items = xhr.response.items;
					obj.items.forEach(function (item) {
						item.action = obj.action;
					});

					if (obj.items.length) {
						_this.process(obj);
					} else {
						_parse(xhr, obj);
					}
				}
			});
		} else {
			var processedItems = obj.items.filter(function (item) {
				return item.obj_id && item.is_normal;
			});

			(function recursive1 (xhr, items) {
				if (items.length) {
					var data = {},
					count = 0,
					limitedList = items.slice(0, 70);

					for (var item of limitedList) {
						if (item.is_nc) {
							data["cash_radio_arr[" + item.obj_id + "]"] = item.action;
						} else {
							data["id_arr[" + (++count) + "]"] = item.obj_id;
							data["radio_arr[" + (count) + "]"] = item.action;
						}
					}

					_msg.log("QuickStock 1/2 $1%", (100 * (1 - items.length / processedItems.length)).toPrecision(3), data);
					_post(data, function (xhr) {
						recursive1(xhr, items.slice(70));
					});
				} else {
					_msg.log("QuickStock 1/2 $1%", "100.0");
					(function recursive2 (index, items) {
						if (index < items.length) {
							var item = items[index];

							_msg.log("QuickStock 2/2 $1%", (100 * (index / items.length)).toPrecision(3), item);
							_actions[item.action](item, function (xhr2) {
								if (xhr2.error) {
									console.error("Error while processing QuickStock:", xhr2.message);
									_parse(xhr, obj);
								} else {
									recursive2(++index, items);
								}
							});
						} else {
							_msg.log("QuickStock 2/2 $1%", "100.0");
							_parse(xhr, obj);
						}
					}(0, obj.items.filter(function (item) {
						return item.obj_id && item.action in _actions;
					})));
				}
			}({}, processedItems));
		}
	};
};
