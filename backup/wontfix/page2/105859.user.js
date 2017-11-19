// ==UserScript==
// @name           Userscripts : Improved Search bars
// @namespace      http://gm.wesley.eti.br/userscripts
// @description    Improves /users/* search bars
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.0.0.0
// @language       en
// @include        http://userscripts-mirror.org/users/*/groups*
// @include        http://userscripts-mirror.org/users/*/scripts*
// @include        http://userscripts-mirror.org/users/*/guides*
// @include        http://userscripts-mirror.org/users/*/posts*
// @include        http://userscripts-mirror.org/users/*/comments*
// @include        http://userscripts-mirror.org/users/*/reviews*
// @include        http://userscripts-mirror.org/users/*/favorites*
// @grant          GM_addStyle
// @grant          GM.addStyle
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
// @icon           http://gm.wesley.eti.br/icon.php?desc=105859
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page2/105859.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @resource       updaterWindowHtml https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/resources/default.html
// @resource       updaterWindowCss https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/resources/default.css
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @history        2.0.0.0 Updated @require#87942
// @history        1.0.0.1 Some little bug fixes
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

(function () {
    if (/\d+\/(\w+)/.test(location.pathname)) {
        var path = RegExp.$1,
        search = xpath("id('section_search')")[0];

        if (!search) {
            search = document.createElement("div");
            search.setAttribute("id", "section_search");
            search.innerHTML = '<form method="get" action="/scripts/search"><input type="text" title="Search" placeholder="Search scripts" name="q" class="input" /><input type="submit" value="" name="submit" class="go" /></form>';

            xpath("id('section')/div[@class~='container']")[0].appendChild(search);
        }

        var q = xpath(".//input[@name='q'][1]", search)[0];

        switch (path) {
            case "comments":
            case "groups":
            case "guides":
            case "reviews":
                q.setAttribute("placeholder", "Search " + path);
                q.form.setAttribute("action", "/" + path);
                break;
            case "posts":
                q.setAttribute("placeholder", "Search forums");
                q.form.setAttribute("action", "/posts/search");
                break;
            default:
                q.setAttribute("placeholder", "Search scripts");
                q.form.setAttribute("action", "/scripts/search");
                break;
        }
    }
})();