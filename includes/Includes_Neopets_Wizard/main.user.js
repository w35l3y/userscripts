// ==UserScript==
// @name        Includes : Neopets : Wizard
// @namespace   http://gm.wesley.eti.br
// @description Wizard Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.1
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @require     https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
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

var Wizard = function (page) {
	var getGroup = function (v) {
		return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_".indexOf(v[0].toUpperCase()) % 13;
	},
	_post = function (data, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/market.phtml",
			referer	: "http://www.neopets.com/market.phtml?type=wizard",
			data	: data,
			delay	: true,
			callback: function (obj) {
				obj.items = xpath(".//td[@class = 'content']/div/table/tbody/tr/td[1]/a[contains(@href, '&buy_obj_info_id=')]", obj.body).map(function (item, index) {
					var row = item.parentNode.parentNode.cells,
					n = function (v) {
						return parseInt(v.replace(/\D+/g, ""), 10);
					},
					owner = item.textContent.trim(),
					link = item.href;

					return {
						index	: index,
						id		: n(link.match(/obj_info_id=(\d+)/)[1]),
						name	: row[1].textContent.trim(),
						link	: (link.indexOf("http://")?"http://www.neopets.com" + ("/" == link[0]?"":"/"):"") + link,
						stock	: n(row[2].textContent),
						price	: n(row[3].textContent),
						owner	: owner,
						group	: getGroup(owner),
					};
				});

				obj.item = {
					name	: xpath("string(.//td[@class = 'content']/div//td[a/img]/b/span/text())", obj.body),
					group	: (obj.items.length?obj.items[0].group:undefined),
				};

				cb(obj);
			},
		});
	};

	this.search = function (obj) {
		var data = {
			table		: "shop",
			criteria	: "exact",
			min_price	: "0",
			max_price	: "99999",
		};

		if ("data" in obj) {
			for (var d in obj.data) {
				data[d] = obj.data[d];
			}
		}

		data.type = "process_wizard";
		data.feedset = "0";
		data.shopwizard = obj.text;

		_post(data, obj.callback);
	};
};