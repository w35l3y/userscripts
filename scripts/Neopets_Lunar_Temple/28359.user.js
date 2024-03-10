// ==UserScript==
// @name           Neopets : Lunar Temple
// @namespace      https://gm.wesley.eti.br/neopets
// @description    Selects the correct image to Lunar Temple
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        4.0.1
// @language       en
// @include        https://www.neopets.com/shenkuu/lunar/?show=puzzle
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           https://gm.wesley.eti.br/icon.php?desc=28359
// @connect        github.com
// @connect        raw.githubusercontent.com
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/scripts/Neopets_Lunar_Temple/28359.user.js
// @resource       i18n ../../includes/Includes_I18n/resources/default.json
// @resource       updaterWindowHtml ../../includes/Includes_Updater/resources/default.html
// @resource       updaterWindowCss ../../includes/Includes_Updater/resources/default.css
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_Translate/85618.user.js
// @require        ../../includes/Includes_I18n/87940.user.js
// @require        ../../includes/Includes_Updater/87942.user.js
// @uso:version    version
// @history        4.0.0 Added <a href="https://userscripts.org/guides/773">Includes Checker</a>
// @history        3.1.0 Added missing @require#56489
// @history        3.0.0.0 Updated @require#87942
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

(function () {
  // script scope
  var interval = JSON.parse(GM_getValue("interval", "[4000, 3000]")),
    answer =
      (8 +
        Math.round(
          document.body.innerHTML.match(/angleKreludor=(\d+)/)[1] / 22.5
        )) %
      16,
    shadow = xpath(
      ".//form[contains(@action, 'results.phtml')]/table/tbody/tr/td/input[@name = 'phase_choice']"
    )[answer];

  if (shadow) {
    setTimeout(function () {
      shadow.click();
    }, interval[0] + Math.floor(Math.random() * interval[1]));
  }
})();
