// ==UserScript==
// @name           Neopets : The Snowager
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Plays The Snowager
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.0.0.0
// @language       en
// @include        http://www.neopets.com/winter/snowager.phtml
// @include        http://www.neopets.com/winter/snowager2.phtml
// @icon           http://gm.wesley.eti.br/icon.php?desc=35213
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page2/35213.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @cfu:version    version
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

(function() {	// script scope
	var interval = JSON.parse(GM_getValue("interval", "[1000, 1000]")),
	snowager = xpath(".//a[contains(@href, 'snowager2.phtml')]")[0];

	if (snowager) {
		setTimeout(function () {
			location.replace(snowager.href);
		}, Math.floor(interval[0] + interval[1] * Math.random()));
	}
})();