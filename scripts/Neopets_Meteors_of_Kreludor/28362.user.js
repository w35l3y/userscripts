// ==UserScript==
// @name           Neopets : Meteors of Kreludor
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Selects the correct option to Meteors of Kreludor
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        4.0.0
// @language       en
// @include        http://www.neopets.com/moon/meteor.phtml?getclose=1
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=28362
// @connect        github.com
// @connect        raw.githubusercontent.com
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/scripts/Neopets_Meteors_of_Kreludor/28362.user.js
// @resource       i18n ../../includes/Includes_I18n/resources/default.json
// @resource       updaterWindowHtml ../../includes/Includes_Updater/resources/default.html
// @resource       updaterWindowCss ../../includes/Includes_Updater/resources/default.css
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_Translate/85618.user.js
// @require        ../../includes/Includes_I18n/87940.user.js
// @require        ../../includes/Includes_Updater/87942.user.js
// @cfu:version    version
// @history        4.0.0 Added <a href="http://userscripts.org/guides/773">Includes Checker</a>
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
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

**************************************************************************/

//GM_setValue("interval", "[1000, 1000]");

(function () {	// script scope
	var field = xpath(".//form[@name = 'meteorselect']/select[@name = 'pickstep'][1]")[0],
	rnd = function (fn) {
		var interval = JSON.parse(GM_getValue("interval", "[1000, 1000]"));
		setTimeout(fn, Math.ceil(interval[0] + interval[1] * Math.random()));
	};
	
	if (field) {
		field.selectedIndex = 1;
		
		rnd(function () {
			field.form.submit();
		});
	}
}());
