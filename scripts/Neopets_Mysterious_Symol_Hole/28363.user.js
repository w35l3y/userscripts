// ==UserScript==
// @name           Neopets : Mysterious Symol Hole
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Plays Mysterious Symol Hole
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2012+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.0.0
// @language       en
// @icon           http://gm.wesley.eti.br/icon.php?desc=28363
// @grant          GM_getValue
// @include        http://www.neopets.com/medieval/symolhole.phtml
// @require        ../../includes/Includes_XPath/63808.user.js
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

(function () {	// script scope
	var user = {
		interval	: JSON.parse(GM_getValue("interval",	"[1000, 2000]"))
	},
	field = xpath(".//form[contains(@action, 'process_symolhole.phtml')]/select[@name = 'goin']")[0];
	field.selectedIndex = Math.floor(100 * Math.random() * field.length % (field.length - 1));

	setTimeout(function () {
		field.form.submit();
	}, Math.floor(user.interval[0] + Math.random() * user.interval[1]));
}());
