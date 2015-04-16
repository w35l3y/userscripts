// ==UserScript==
// @name        Includes : Neopets : Bank
// @namespace   http://gm.wesley.eti.br
// @description Bank Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_[BETA]/main.user.js
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

var Bank = function (page) {
	var _post = function (data, cb) {
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/process_bank.phtml",
			referer	: "http://www.neopets.com/bank.phtml",
			data	: data,
			delay	: true,
			callback: cb,
		});
	};

	this.withdraw = function (obj) {
		_post({
			type	: "withdraw",
			amount	: obj.value,
			pin		: page.pin,
		}, obj.callback);
	};
};