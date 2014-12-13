// ==UserScript==
// @name           Includes : JellyNeo : ItemDatabase [BETA]
// @namespace      http://gm.wesley.eti.br/includes/jellyneo
// @description    JellyNeo.ItemDatabase Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.2 BETA
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

JellyNeo.ItemDatabase = function () {};

JellyNeo.ItemDatabase.shops = function shops(params){
	HttpRequest.open({
		"method" : "get",
		"url" : "http://www.jellyneo.net/?go=shopsdirectory",
		"onsuccess" : function (xhr) {
			var ai, at, shopInfo = xpath("//td[@width='150']", xhr.response.xml);
			var shops = new Array();
			for (ai = 0,at = shopInfo.length; ai < at; ++ai) {
				var link = xpath("string(.//a[contains(@href, 'neopets.com')]/@href)",shopInfo[ai]);
				var jnLink = xpath("string(.//a[contains(@href, 'items.jellyneo')]/@href)",shopInfo[ai]);
				var shopName = xpath("string(.//a[contains(@href, 'neopets.com')]/text()[2])",shopInfo[ai]);
				if(link.indexOf('obj_type=') !== -1){
					neoCategory = link.split("obj_type=")[1];
				}else{
					neoCategory = link;
				}
				if(jnLink){
					shops.push({
						"itemdb" : jnLink,
						"link" : link,
						"name" : shopName,
						"cat" : neoCategory
					});
				}
			}
			params.callback(shops);
		}
	}).send();
};

JellyNeo.ItemDatabase.getTotal = function (params){
	var data = {
		"go" : "show_items",
		"sortby" : "price",
		"ncoff" : 1,
		"start" : 0,
		"r1" : 1,
		"r2" : 99
	};

	for (ai in params.data) {
		data[ai] = params.data[ai];
	}

	HttpRequest.open({
		"method" : "get",
		"url" : "http://items.jellyneo.net/index.php",
		"onsuccess" : function (xhr) {
			var next = xpath("string(id('content')/b/text())", xhr.response.xml);
			var next = next.split(" ")[0];
			params.callback(next);
		}
	}).send(data);
};

JellyNeo.ItemDatabase.find = function (params) {
	var data = {
		"go" : "show_items",
		"sortby" : "release",
		"sortby_type" : "desc",
		"numitems" : 100,
		"ncoff" : 1,
		"start" : 0
	},
	ai;

	if (!params.pages) {
		params.pages = 0;
	}

	for (ai in params.data) {
		data[ai] = params.data[ai];
	}

	(function recursive (page, list) {
		HttpRequest.open({
			"method" : "get",
			"url" : "http://items.jellyneo.net/index.php",
			"onsuccess" : function (xhr) {
				var next = xpath("string(id('content')/p/a[text() = 'Next']/@href)", xhr.response.xml),
				items = xpath("id('content')/form/center/table//tr/td", xhr.response.xml),
				ai, at;

				for (ai = 0, at = items.length; ai < at; ++ai) {
					let img = xpath(".//img", items[ai]);

					if (img.length) {
						list.push({
							"id" : /\bshowitem=(\d+)/.test(img[0].parentNode.href) && RegExp.$1,
							"name" : img[0].getAttribute("title"),
							"image" : img[0].getAttribute("src"),
							"price" : parseInt(xpath("string(.//a[contains(@href, '=price_history&')]/text())", items[ai]).replace(/[,.]/g, ""), 10)
						});
					}
				}

				if ((params.pages === -1 || page < params.pages) && next && /\bstart=(\d+)/.test(next)) {
					data.start = RegExp.$1;

					recursive(++page, list);
				} else {
					params.callback(list);
				}
			}
		}).send(data);
	}(0, []));
};
