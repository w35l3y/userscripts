// ==UserScript==
// @name           Neopets : Bank and Till
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Shows bank and till values in the page header
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2015+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.1.0
// @include        http://*.neopets.com/*
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
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

function get_np(p, n) {
	return xpath("string(" + n + ")", p).replace(/\snp$/ig, "");
}

// bank
if (location.pathname == "/bank.phtml") {
	GM_setValue("bank", get_np(document, "id('content')/table/tbody/tr/td[2]/div[2]/table/tbody/tr/td[2]/table/tbody/tr[2]/td[2]"));
}

// till
var current = new Date().valueOf();
if (location.pathname == "/market.phtml" && /[&?]type=till\b/.test(location.search)) {
	GM_setValue("LastAccess", "" + current);
	
	GM_setValue("till", get_np(document, "id('content')/table/tbody/tr/td[2]/p[1]/b"));
} else {
	const INTERVAL = 1 * 60 * 60 * 1000; // 1 hour
	if (parseInt(GM_getValue("LastAccess", "0"), 10) + INTERVAL < current) {
		GM_setValue("LastAccess", "" + current);
		
		HttpRequest.open({
			"method" : "get",
			"url" : "http://www.neopets.com/market.phtml",
			"onsuccess" : function (params) {
				GM_setValue("till", get_np(params.response.xml, "id('content')/table/tbody/tr/td[2]/p[1]/b"));
			}
		}).send({
			"type" : "till"
		});
	}
}

var nav = xpath("id('header')/table/tbody/tr[1]/td[3]/a[1]")[0];
if (nav) {
	var span = document.createElement("span");
	span.innerHTML = ['','Bank: <a href="http://www.neopets.com/bank.phtml">' + (GM_getValue("bank", "0") || "0") +'</a>', 'Till: <a href="http://www.neopets.com/market.phtml?type=till">' + (GM_getValue("till", "0") || "0") + '</a>'].join(' <span style="font-weight: normal;">|</span> ');
	nav.parentNode.insertBefore(span, nav.nextSibling);
}
