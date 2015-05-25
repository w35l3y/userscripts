// ==UserScript==
// @name        Includes : JellyNeo : Battlepedia
// @namespace   http://gm.wesley.eti.br
// @description Battlepedia Function
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
// @grant       GM_getResourceText
// @require     https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_[BETA]/main.user.js
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

var Battlepedia = function () {
	var count = function (nodes) {
		var output = {},
		tValue = "value";

		nodes.forEach(function (item) {
			var k = (/newicons\/(\w)/.test(item.getAttribute("src"))?RegExp.$1.toUpperCase():undefined),
			type = (item.nextSibling && /\+|\d+(?=%)|all/i.test(item.nextSibling.textContent)?RegExp["$&"]:undefined);

			if (k in output) {
				++output[k][tValue];
				output[k].type = "N";
			} else {
				output[k] = {
					value	: 0,
					random	: 0,
					type	: "%",
				};

				output[k][tValue] = (isNaN(type)?1:type/100);
			}

			if ("+" == type) {
				tValue = "random";
			}
		});
		
		return output;
	};

	this.search = function (obj) {
		var data = {
			search		: obj.item || "",
			name_type	: obj.type || "exact",
			itemusage	: obj.usage || "0",
			atkmin		: "",
			atkmax		: "",
			defmin		: "",
			defmax		: "",
			hpmin		: "",
			hpmax		: "",
			sortorder	: "desc",
			sorttype	: "rating",
		},
		output = {
			start	: 25 * obj.page || 0,
			end		: 0,
			total	: 0,
			list	: [],
		};
		if ("data" in obj) {
			for (var k in obj.data) {
				data[k] = obj.data[k];
			}
		}

		(function recursive (start) {
			data.s = start;
			output.end = start;

			HttpRequest.open({
				method		: "get",
				url			: "http://battlepedia.jellyneo.net/index.php",
				headers		: {
					Referer	: "http://battlepedia.jellyneo.net/index.php",
				},
				onsuccess	: function (xhr) {
					var num = xpath("string(id('content')/h3/text()[starts-with(., 'Showing results')])", xhr.response.xml).split(/\D+/g).map(parseFloat);

					Array.prototype.push.apply(output.list, xpath("id('content')//tr[td[1]/a]", xhr.response.xml).map(function (row) {
						var img = xpath("./td[1]//img", row)[0]
						return {
							id		: (/id=(\d+)/.test(img.parentNode.getAttribute("href"))?parseInt(RegExp.$1, 10):undefined),
							jnId	: (/showitem=(\d+)/.test(xpath("string(.//a[img[contains(@src, 'icon_link_itemdatabase')]]/@href)", row))?parseInt(RegExp.$1, 10):undefined),
							type	: xpath("string(./td[2]/a/p/text())", row),
							name	: img.getAttribute("alt"),
							image	: (/items\/(\w+)/.test(img.getAttribute("src"))?RegExp.$1:undefined),
							attack	: count(xpath("./td[3]/img", row)),
							defense	: count(xpath("./td[4]/img", row)),
							/*
							reflect	: count(xpath("./td[5]", row)),	// TODO ser mais específico
							effects	: count(xpath("./td[5]", row)),	// TODO ser mais específico
							*/
							rating	: parseFloat(xpath("string(.//div[contains(@class, 'rating')]/text())", row)),
						};
					}));

					if (obj.showAll && ((start += num[2]) < num[3])) {
						recursive(start);
					} else {
						output.total = num[3];
						obj.callback(output);
					}
				}
			}).send(data);
		}(output.start));
	};

	this.searchAll = function (obj) {
		var _this = this,
		res = {
			start	: 0,
			total	: 0,
			list	: [],
		};

		if (obj.items.length) {
			(function recursive (index) {
				_this.search({
					item	: obj.items[index],
					type	: "exact",
					usage	: "0",
					callback: function (o) {
						Array.prototype.push.apply(res.list, o.list);
						res.total += o.total;

						if (++index < obj.items.length) {
							recursive(index);
						} else {
							obj.callback(res);
						}
					},
				});
			}(0));
		} else {
			obj.callback(res);
		}
	};
};