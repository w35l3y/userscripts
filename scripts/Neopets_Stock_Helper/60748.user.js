// ==UserScript==
// @name           Neopets : Stock Helper
// @namespace      https://gm.wesley.eti.br/neopets
// @description    Keeps all the previous prices of your shop stored
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        2.0.1
// @language       en
// @include        https://www.neopets.com/market.phtml?type=your*
// @include        https://www.neopets.com/market.phtml?*&type=your*
// @include        https://www.neopets.com/market_your.phtml
// @include        https://www.neopets.com/process_market.phtml
// @icon           https://gm.wesley.eti.br/icon.php?desc=60748
// @connect        github.com
// @connect        raw.githubusercontent.com
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/scripts/Neopets_Stock_Helper/60748.user.js
// @resource       i18n ../../includes/Includes_I18n/resources/default.json
// @resource       updaterWindowHtml ../../includes/Includes_Updater/resources/default.html
// @resource       updaterWindowCss ../../includes/Includes_Updater/resources/default.css
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_Translate/85618.user.js
// @require        ../../includes/Includes_I18n/87940.user.js
// @require        ../../includes/Includes_Updater/87942.user.js
// @history        2.0.0 Fixed some bugs
// @history        1.0.3.0 Firefox 4 bug fixes
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

if (/^\/process_market\.phtml/i.test(location.pathname)) {
  // something went wrong
  GM_deleteValue("StockTemp");
} else {
  var items = xpath(".//td[@class='content']//td[5]/input");
  var stocktemp = JSON.parse(GM_getValue("StockTemp", "{}")),
    stock = JSON.parse(GM_getValue("Stock", "{}"));

  for (var item in stocktemp) {
    stock[item] = stocktemp[item]; // stores the temporary prices definitely
  }

  GM_deleteValue("StockTemp");
  GM_setValue("Stock", JSON.stringify(stock));

  items.forEach(function (item) {
    var pos = item.name.match(/\d+$/)[0],
      id = item.form.elements.namedItem("obj_id_" + pos);

    if (item.value == "0") {
      // item is new in the list
      if (id.value in stock) {
        // price stored
        item.value = stock[id.value];

        item.parentNode.parentNode.style.backgroundColor = "#CCFFCC"; // green bg
      } else {
        item.parentNode.parentNode.style.backgroundColor = "#FFCCCC"; // red bg
      }

      var cells = item.parentNode.parentNode.cells;
      for (
        var ai = 0, at = cells.length;
        ai < at;
        ++ai // removes yellow bg from the current line
      )
        cells[ai].removeAttribute("bgcolor");

      item.parentNode.parentNode.parentNode.insertBefore(
        item.parentNode.parentNode,
        item.parentNode.parentNode.parentNode.rows[1]
      ); // changes the order of the lines
    }
  });

  if (items.length)
    // list is not empty
    items[0].form.addEventListener(
      "submit",
      function (e) {
        var stocktemp = {};

        items.forEach(function (item) {
          var pos = item.name.match(/\d+$/)[0],
            id = e.target.elements.namedItem("obj_id_" + pos);

          if (item.value != "0") {
            stocktemp[id.value] = item.value; // stores the current prices temporarily
          }
        });

        GM_setValue("StockTemp", JSON.stringify(stocktemp));
      },
      false
    );
}
