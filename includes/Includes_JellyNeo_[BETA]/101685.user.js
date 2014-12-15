// ==UserScript==
// @name           Includes : JellyNeo [BETA]
// @namespace      http://gm.wesley.eti.br/includes/jellyneo
// @description    JellyNeo Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.0.1 BETA
// @language       en
// @include        nowhere
// @exclude        *
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
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

if (!JellyNeo) {
	var JellyNeo = function () {};
}

JellyNeo.shops = function (params) {
	HttpRequest.open({
		"method"	: "get",
		"url"		: "http://www.jellyneo.net/index.php",
		"onsuccess"	: function (xhr) {
			var getQS = function (v) {
				var re = /[&?](\w+)=(\w+)/gi,
				out = {};

				while (re.exec(v)) {
					out[RegExp.$1] = RegExp.$2;
				}

				return {
					"raw"	: v,
					"params": out
				};
			};

			params.callback({
				list	: xpath(".//td[a[contains(@href, 'neopets.com')]/br]", xhr.response.xml).map(function (shop) {
					var npLink = xpath("./a[contains(@href, 'neopets.com')]", shop)[0];

					return {
						"name"		: npLink.textContent.trim(),
						"npLink"	: getQS(npLink.getAttribute("href")),
						"jnLink"	: getQS(xpath("string(./a[contains(@href, 'items.jellyneo')]/@href)", shop))
					};
				})
			});
		}
	}).send({
		"go"	: "shopsdirectory"
	});
};

JellyNeo.ItemDatabase = function () {};

JellyNeo.ItemDatabase.find = function (params) {
	var data = {
		"go"			: "show_items",
		"sortby"		: "release",
		"sortby_type"	: "desc",
		"numitems"		: 100,
		"ncoff"			: 1,
		"start"			: 0
	},
	total = 0,
	ai;

	if (!params.pages) {
		params.pages = 0;
	}

	for (ai in params.data) {
		data[ai] = params.data[ai];
	}

	(function recursive (page, list) {
		HttpRequest.open({
			"method"	: "get",
			"url"		: "http://items.jellyneo.net/index.php",
			"onsuccess"	: function (xhr) {
				if (!page) {
					total = parseInt(xpath("number(substring-before(id('content')/b/text(), ' '))", xhr.response.xml), 10);
				}
				var next = xpath("string(id('content')/p/a[text() = 'Next']/@href)", xhr.response.xml),
				pageList = xpath("id('content')/form/center/table//tr/td[.//img]", xhr.response.xml).map(function (item) {
					var img = xpath(".//img", item)[0];

					return {
						"id"	: /\bshowitem=(\d+)/.test(img.parentNode.href) && RegExp.$1,
						"name"	: img.getAttribute("title"),
						"image"	: img.getAttribute("src"),
						"price"	: parseInt(xpath("string(.//a[contains(@href, '=price_history&')]/text())", item).replace(/[,.]/g, ""), 10)
					};
				});

				params.pages && params.each && params.each({
					total	: total,
					page	: page,
					list	: pageList,
					data	: data
				});

				Array.prototype.push.apply(list, pageList);
				if ((params.pages === -1 || page < params.pages) && next && /\bstart=(\d+)/.test(next)) {
					data.start = RegExp.$1;

					recursive(++page, list);
				} else {
					params.callback({
						total	: total,
						page	: page,
						list	: list,
						data	: data
					});
				}
			}
		}).send(data);
	}(0, []));
};
