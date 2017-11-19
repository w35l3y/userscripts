// ==UserScript==
// @name           Neopets : Healing Springs
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Accesses the Healing Springs every 30 minutes
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2016+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0
// @language       en
// @include        http://www.neopets.com/*
// @exclude        http://www.neopets.com/colorpallette.phtml
// @exclude        http://www.neopets.com/neomail_block_check.phtml?*
// @exclude        http://www.neopets.com/ads/*
// @exclude        http://www.neopets.com/games/play_flash.phtml?*
// @exclude        http://www.neopets.com/iteminfo.phtml?*
// @icon           http://gm.wesley.eti.br/icon.php?desc=54095
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_xmlhttpRequest
// @grant          GM.xmlHttpRequest
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_Neopets_[BETA]/main.user.js
// @noframes
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

var np = new Neopets(document);

if (np.username)
(async function recursive () {    // script scope
    const INTERVAL = 1810000;    // 30 * 60 * 1000 + 10 * 1000 (30 minutes + 10 seconds)

    var n = "HealingSprings-LastAccess-" + np.username,
    la = Date.parse(await GM.getValue(n, "Sat Apr 16 2011 08:13:43 GMT-0300")) || 0,
    curr = new Date();

    if (curr - la > INTERVAL) {
        await GM.setValue(n, (la = curr).toString());

        HttpRequest.open({
            method        : "POST",
            url        : "http://www.neopets.com/faerieland/springs.phtml",
            headers        : {
                "Referer" : "http://www.neopets.com/faerieland/springs.phtml"
            },
            onsuccess    : function(xhr) {
                var msg = xpath(".//td[@class = 'content']//div[@class = 'errormess' and b] | .//td[@class = 'content']//center[1]", xhr.response.xml)[0];

                np.console.log("Healing Springs : " + msg.textContent);
            }
        }).send({
            type    : "heal"
        });
    }

    setTimeout(recursive, la - curr + INTERVAL + Math.ceil(10 * Math.random()));
})();
