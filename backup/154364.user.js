// ==UserScript==
// @name           Neopets : Random Events [BETA]
// @namespace      http://gm.wesley.eti.br
// @description    Loggs random events
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.1.1
// @language       en
// @include        http://www.neopets.com/*
// @exclude        http://www.neopets.com/ads/*
// @exclude        http://www.neopets.com/games/play_flash.phtml?*
// @exclude        http://www.neopets.com/neomail_block_check.phtml?*
// @exclude        http://www.neopets.com/iteminfo.phtml?*
// @exclude        http://www.neopets.com/~*
// @grant          GM_log
// @grant          GM.log
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_openInTab
// @grant          GM.openInTab
// @grant          GM_deleteValue
// @grant          GM.deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM.xmlHttpRequest
// @grant          GM_getResourceText
// @grant          GM.getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=154364
// @resource       random_events https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_Random_Events/resources/default.csv
// @resource       randomEventsHtml https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_Random_Events/resources/default.html
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Persist_[BETA]/154322.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_Random_Events/154363.user.js
// @history        1.1.1 Added missing @icon
// @history        1.1.0 Added Includes Checker (due to the recent problems with userscripts-mirror.org)
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

RandomEvents.process({
    onload    : function (obj) {
        alert("Random events saved successfully");
    },
    onerror    : function (obj) {
        alert(obj.value);
    },
});