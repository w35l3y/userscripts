// ==UserScript==
// @name           Neopets : Hide 'n Seek
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Plays Hide 'n Seek until your pet get bored.
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.1.0
// @language       en
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @include        http://www.neopets.com/games/hidenseek.phtml
// @include        http://www.neopets.com/games/process_hideandseek.phtml?*
// @include        http://www.neopets.com/games/hidenseek/*.phtml?xfn=
// @include        http://www.neopets.com/games/hidenseek/*.phtml
// @icon           http://gm.wesley.eti.br/icon.php?desc=34085
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
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

//GM.setValue("interval", "[1000, 1000]");

(function () {	// script scope
	var interval = JSON.parse(GM.getValue("interval", "[1000, 500]")),
	rnd = Math.floor(interval[0] + interval[1] * Math.random());

	switch (location.pathname) {
		case "/games/hidenseek.phtml":
			var places = xpath(".//td[@class = 'content']//tr/td/a[img and contains(@onclick, '.phtml?xfn=')]");

			GM.setValue("places", "{}");
			GM.setValue("total", places.length);

			if (places.length) {
				setTimeout(function (place) {
					location.assign("javascript:void(function () {" + place.getAttribute("onclick") + "}())");
				}, rnd, places[Math.floor(places.length * Math.random())]);
			}
			break;
		case "/games/process_hideandseek.phtml":
			if (/\?p=(\d+)&game=(\d+)/.test(location.search)) {
				var places = JSON.parse(GM.getValue("places", "{}")),
				total = GM.getValue("total", 32);
				area = RegExp.$1,
				board = RegExp.$2,
				href = xpath("string(.//a/@href)");
				
				if (!(board in places)) {
					places[board] = [];
				}
				
				places[board].push(parseInt(area, 10));

				if (href) {
					var next = /#/.test(href);

					if (next) {
						var tmp = [];

						while ((board = Math.floor(total * Math.random())) in places) {
							tmp.push(board);
							
							if (tmp.length >= total) {
								places = {};
								tmp = [];
							}
						}
					}
					
					setTimeout(function (b, next) {
						var url = "http://www.neopets.com/games/hidenseek/" + b + ".phtml";

						if (next) {
							url += "?xfn=";
						}

						location.replace(url);
					}, rnd, board, next);
				}

				GM.setValue("places", JSON.stringify(places));
			}
			break;
		default:
			if (/(\d+)\.phtml/.test(location.pathname)) {
				var places = JSON.parse(GM.getValue("places", "{}")),
				board = RegExp.$1,
				areas = xpath(".//map/area[contains(@href, '&game=" + board + "')]");

				if (!(board in places)) {
					places[board] = [];
				}

				if (places[board].length < areas.length) {
					var index;

					while (~places[board].indexOf(index = Math.floor(1 + areas.length * Math.random()))) {}

					setTimeout(function(area) {
						area.click();
					}, rnd, areas[index - 1]);
				}
			}
			break;
	}
}());