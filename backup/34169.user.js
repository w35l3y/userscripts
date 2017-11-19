// ==UserScript==
// @name           Neopets : Sid Alert
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Opens a new tab if Sid is up for fighting
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.1.0
// @language       en
// @homepage       http://www.wesley.eti.br
// @include        http://www.neopets.com/*
// @exclude        http://www.neopets.com/ads/*
// @exclude        http://www.neopets.com/games/play_flash.phtml?*
// @exclude        http://www.neopets.com/neomail_block_check.phtml?*
// @exclude        http://www.neopets.com/iteminfo.phtml?*
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=34169
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/34169.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @uso:version    version
// @history        2.1.0 Fixed to the new Battledome
// @history        2.0.0.1 Fixed @resource i18n
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

(function recursive () {	// script scope
	var user = {
		"interval" : JSON.parse(GM_getValue("interval", "[600000, 300000]"))
	};

	var min = Math.floor(user.interval[0] / 60000);
	var currentDate = new Date();
	currentDate.setMinutes(min * Math.floor(currentDate.getMinutes() / min), 0, 0);
	currentDate = "" + currentDate.valueOf();

	if (GM_getValue("lastAccess", "0") != currentDate) {
		GM_setValue("lastAccess", currentDate);

		HttpRequest.open({
			"method" : "GET",
			"url" : "http://www.neopets.com/dome/fight.phtml",
			"headers" : {
				"Referer" : "http://www.neopets.com/dome/neopets.phtml"
			},
			"onsuccess" : function (xhr) {
				var r = xhr.response.text.replace(/\s+/g, "").toLowerCase();

				// Auto opponent(Flaming Meerca) is there AND Punchbag Bob isn't, so Sid is!
				if (~r.indexOf('data-oppid="1"') && !~r.indexOf('data-diffs="0;0;0"')) {
					GM_openInTab("http://www.neopets.com/dome/fight.phtml");
					alert("Apparently Sid is up for fighting!");
				}
			}
		}).send();
	}

	setTimeout(recursive, user.interval[0] + user.interval[1] * Math.random());
})();