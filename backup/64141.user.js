// ==UserScript==
// @name           Neopets : Moltara Gears + Worms [Silent version]
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Silently refreshes Moltara City/Caves until items be found
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.0.0.1
// @language       en
// @include        http://www.neopets.com/magma/
// @include        http://www.neopets.com/magma/index.phtml
// @include        http://www.neopets.com/magma/caves.phtml
// @grant          GM_log
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=64141
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/64141.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @history        2.0.0.1 Added search option
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

/*
	0x01	gears
	0x02	worms
	0x03	gears + worms
*/

//GM_setValue("search", 0x01);	// gears only

(function () {
	var start = true;

	function fsearch (s) {
		switch (s) {
			case "material_url":
				return 0x01;	// gears
		}

		if (/worm\d+/.test(s)) {
			return 0x02;	// worms
		} else {
			return 0x00;	// disabled
		}
	}

	(function recursive (doc) {
		var moltara = xpath(".//script[contains(text(), '/maps/magma/moltara')]", doc)[0],
		search = GM_getValue("search", 0x03);

		if (moltara) {
			var re = /swf\.addVariable\(([''""])(worm\d+|material_url)\1,\1([^'"]+)/img,
			context = moltara.textContent.replace(/\s+/gm, "");

			for (var line;line = re.exec(context);) {
				if (search & fsearch(line[2])) {
					start = false;
					GM_openInTab("http://www.neopets.com" + decodeURIComponent(line[3]));
				}
			}
		}

		if (start) {
			GM_log("Nothing found!");

			setTimeout(function () {
				HttpRequest.open({
					"method" : "get",
					"url" : location.href,
					"onsuccess" : function (xhr) {
						recursive(xhr.response.xml);
					}
				}).send();
			}, 1200 + Math.floor(700 * Math.random()));
		} else {
			alert("Some items were found. Refresh the page in case you want to continue searching.");
		}
	}());
}());