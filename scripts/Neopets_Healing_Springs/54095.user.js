// ==UserScript==
// @name           Neopets : Healing Springs
// @namespace      https://gm.wesley.eti.br/neopets
// @description    Accesses the Healing Springs every 30 minutes
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2016+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        1.0.0
// @language       en
// @include        https://www.neopets.com/*
// @exclude        https://www.neopets.com/colorpallette.phtml
// @exclude        https://www.neopets.com/neomail_block_check.phtml?*
// @exclude        https://www.neopets.com/ads/*
// @exclude        https://www.neopets.com/games/play_flash.phtml?*
// @exclude        https://www.neopets.com/iteminfo.phtml?*
// @icon           https://gm.wesley.eti.br/icon.php?desc=54095
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
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
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

**************************************************************************/

var np = new Neopets(document);

if (np.username)
  (function recursive() {
    // script scope
    const INTERVAL = 1810000; // 30 * 60 * 1000 + 10 * 1000 (30 minutes + 10 seconds)

    var n = "HealingSprings-LastAccess-" + np.username,
      la = Date.parse(GM_getValue(n, "Sat Apr 16 2011 08:13:43 GMT-0300")) || 0,
      curr = new Date();

    if (curr - la > INTERVAL) {
      GM_setValue(n, (la = curr).toString());

      HttpRequest.open({
        method: "POST",
        url: "https://www.neopets.com/faerieland/springs.phtml",
        headers: {
          Referer: "https://www.neopets.com/faerieland/springs.phtml",
        },
        onsuccess: function (xhr) {
          var msg = xpath(
            ".//td[@class = 'content']//div[@class = 'errormess' and b] | .//td[@class = 'content']//center[1]",
            xhr.response.xml
          )[0];

          np.console.log("Healing Springs : " + msg.textContent);
        },
      }).send({
        type: "heal",
      });
    }

    setTimeout(recursive, la - curr + INTERVAL + Math.ceil(10 * Math.random()));
  })();
