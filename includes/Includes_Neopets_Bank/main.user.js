// ==UserScript==
// @name        Includes : Neopets : Bank
// @namespace   http://gm.wesley.eti.br
// @description Bank Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.1.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @require     https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
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
			callback: function (xhr) {
				var _n = function (v) {
					return parseInt(xpath("string(" + v + ")", xhr.body).replace(/\D+/g, ""), 10);
				};

				Object.defineProperties(xhr, {
					response	: {
						get	: function () {
							return {
								type		: _n(".//option[starts-with(text(), //td[@class = 'content']//td//td[starts-with(@style, 'background-color:')]/text())]/@value"),
								balance		: _n(".//td[@class = 'content']/div/table//td//tr[2]/td[2]/text()"),
								daily		: _n(".//td[@class = 'content']//div/table/tbody/tr[2]/td/b/text()"),
								is_collected: !xpath("boolean(.//td[@class = 'content']//input[@value = 'interest'])", xhr.body),
							};
						}
					}
				});

				cb(xhr);
			}
		});
	};

	this.withdraw = function (obj) {
		_post({
			type	: "withdraw",
			amount	: obj.value,
			pin		: page.pin
		}, obj.callback);
	};

    this.deposit = function (obj) {
        _post({
            type    : "deposit",
            amount  : obj.value
        }, obj.callback);
    };
    
    this.collect = function (obj) {
        _post({
			type	: "interest"
		}, obj.callback);
	};
};
