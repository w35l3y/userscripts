// ==UserScript==
// @name           Userscripts : Beautifier + Deobfuscator
// @namespace      https://gm.wesley.eti.br/userscripts
// @description    Deobfuscates scripts
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        3.0.0
// @language       en
// @include        https://userscripts-mirror.org/scripts/review/*
// @include        https://greasefire.userscripts-mirror.org/scripts/review/*
// @include        https://userscripts-mirror.org/scripts/version/*.user.js?format=txt
// @include        https://greasefire.userscripts-mirror.org/scripts/version/*.user.js?format=txt
// @include        file://*.user.js
// @grant          GM_log
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           https://gm.wesley.eti.br/icon.php?desc=58687
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page1/58687.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @resource       updaterWindowHtml https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/resources/default.html
// @resource       updaterWindowCss https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/resources/default.css
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_JsCode/87269.user.js
// @require        https://raw.github.com/einars/js-beautify/master/js/lib/beautify.js
// @history        3.0.0 Fixed some bugs
// @history        2.1.1 Updated @require#beautify.js
// @history        2.1.0 Updated @require#87942
// @history        2.0.0.0 Updated @require#87942
// @history        1.1.1.0 Added "Deobfuscate" button
// @history        1.1.0.1 Works on local files
// @history        1.1.0.0 Updated @require #87269
// @history        1.0.6.0 Fixed incompatibility with the latest version of @require #87269
// @history        1.0.5.3 Updated @require #87269
// @history        1.0.5.2 Changed github @require protocol (http->https)
// @history        1.0.5.1 Added i18n, updater and support for "atob"
// @contributor    LouCypher (https://userscripts-mirror.org/topics/112782#posts-445385)
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
  var config = JSON.parse(
      GM_getValue(
        "config",
        JSON.stringify({
          highlight: false,
        })
      )
    ),
    head = document.getElementById("heading"),
    notice = xpath(
      ".//p[@class = 'notice']/text()[contains(., 'the source is over 100KB')]"
    )[0],
    decode = document.createElement("div"),
    deobfuscate = function (highlight) {
      var loc = location.pathname.match(/^\/scripts\/(\w+)\/(\d+)/),
        source = xpath(
          {
            review: "id('source')",
            diff: "id('content')/pre",
            version: "./html/body/pre",
            default: "./body",
          }[(loc && loc[1]) || "default"]
        )[0];

      if (loc && loc[1]) {
        source.textContent = JsCode.deobfuscate(
          source.textContent,
          JSON.parse(GM_getValue("scripts", "{}"))[loc[2]]
        );
      } else {
        var pre = document.createElement("pre");
        pre.textContent = JsCode.deobfuscate(source.textContent);
        source.parentNode.replaceChild(pre, source);
      }

      if (
        highlight &&
        !xpath("boolean(.//a/text()[contains(., 'Add Syntax Highlighting')])")
      ) {
        location.assign("javascript:sh_highlightDocument();");
      }
    };

  if (head) {
    decode.setAttribute("id", "install_script");
    decode.innerHTML =
      '<a class="userjs" href="javascript:void(0)">Deobfuscate</a>';

    head.parentNode.insertBefore(decode, head);

    if (notice) {
      notice.nodeValue += ". Deobfuscating the code might freeze your browser.";

      decode.firstElementChild.addEventListener(
        "click",
        function (e) {
          deobfuscate(config.highlight);
        },
        false
      );
    } else {
      deobfuscate(true);
    }
  }
})();
