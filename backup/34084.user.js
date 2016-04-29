// ==UserScript==
// @name           Neopets : Snowager Alert
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Opens a new tab if Snowager is asleep
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.0.0.0
// @language       en
// @include        http://www.neopets.com/*
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=34084
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/34084.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @cfu:version    version
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

(function recursive()
{	// script scope
	var last = Date.parse(GM_getValue("lastAccess", "Mon Jun 20 2011 20:40:43 GMT-0300")),
	curr = new Date(),
	interval = 28800000;	// 8 hours

	curr.setMinutes(0, 0, 0);
	if (last != curr.valueOf() && /^(?:6am|2pm|10pm)$/.test(unsafeWindow.nh + unsafeWindow.na))
	{
		GM_setValue("lastAccess", (last = curr).toString());
		GM_openInTab("http://www.neopets.com/winter/snowager.phtml");
	}

	setTimeout(recursive, (last - curr) + interval);
})();