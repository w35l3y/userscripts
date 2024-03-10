// ==UserScript==
// @name           Neopets : Personalized Style Remover
// @namespace      https://gm.wesley.eti.br
// @description    Removes all personalized styles from many places
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        2.0.2
// @language       en
// @include        https://www.neopets.com/browseshop.phtml?*owner=*
// @include        https://www.neopets.com/gallery/index.phtml?*gu=*
// @include        https://www.neopets.com/userlookup.phtml?*user=*
// @include        https://www.neopets.com/userlookup.phtml?*randomfriend=*
// @include        https://www.neopets.com/petlookup.phtml?*pet=*
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_getResourceText
// @icon           https://gm.wesley.eti.br/icon.php?desc=126025
// @resource       winConfigCss https://github.com/w35l3y/userscripts/raw/master/includes/Includes_WinConfig/resources/default.css
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_WinConfig/163374.user.js
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

GM_addStyle(
  ".winConfig_StyleRemoverSettings .fieldName_enable .subfield {width: 50%;}.winConfig_StyleRemoverSettings .fieldName_enable .subfield > label {width: 60%;}"
);

(function () {
  var page = {
      "/browseshop.phtml": [
        0x01,
        ".//td[@class = 'content']/*[preceding-sibling::comment()[contains(., 'desc start')] and following-sibling::comment()[contains(., 'desc end')]]",
      ],
      "/userlookup.phtml": [
        0x02,
        ".//td[@class = 'content']/table[1]/preceding-sibling::div[1]",
      ],
      "/petlookup.phtml": [
        0x04,
        ".//td[@class = 'content']/div[position() = last()]",
      ],
      "/gallery/index.phtml": [
        0x08,
        ".//td[@class = 'content']/div/*[preceding-sibling::a[2] and (following-sibling::hr[1] or ../../hr[1])]",
      ],
    }[location.pathname],
    win = new WinConfig({
      title: "Style Remover : Settings",
      type: WinConfig.WindowType.CUSTOM,
      size: ["300px", 0],
      fields: [
        {
          name: "settingsHotKey",
          label: "Settings HotKey",
          key: "hotkey",
          callback: function (event, win) {
            win.open();
          },
        },
        {
          name: "enable",
          type: WinConfig.FieldType.CHECK,
          format: WinConfig.FieldFormat.NUMBER,
          multiple: true,
          unique: true,
          empty: 0x00,
          default: 0x01,
          value: [
            {
              value: 0x01,
              label: "Shop",
            },
            {
              value: 0x08,
              label: "Gallery",
            },
            {
              value: 0x02,
              label: "User Lookup",
            },
            {
              value: 0x04,
              label: "Pet Lookup",
            },
          ],
        },
      ],
    }),
    enable = win.get("enable", 0x0);

  if (enable & page[0]) {
    var root = xpath(page[1]);

    for (var ai in root) {
      root[ai].parentNode.removeChild(root[ai]);
    }
  }
})();
