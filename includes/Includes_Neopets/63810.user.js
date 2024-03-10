// ==UserScript==
// @name           Includes : Neopets
// @namespace      https://gm.wesley.eti.br/includes/neopets
// @description    Neopets Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        2.0.0
// @language       en
// @include        nowhere
// @exclude        *
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
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

**************************************************************************/

Neopets = function () {};

Neopets.convert = function (doc) {
  return new (function (_d) {
    var _t = new Date(),
      _s = function (e) {
        return xpath("string(" + e + ")", _d) || "";
      },
      _n = function (e) {
        return (
          parseInt(
            (_s(e).match(/^\d+(?:[,.]\d{3})*/) || [""])[0].replace(
              /[,.]+/g,
              ""
            ),
            10
          ) || 0
        );
      },
      _o = function (tz) {
        var r,
          c = new Date(),
          v = /(\d+):(\d+):(\d+)(?: (\w+))?/.test(_s("id('nst')", _d)),
          o = {
            nh: RegExp.$1 || ((c.getUTCHours() - tz - 1) % 12) + 1,
            nm: RegExp.$2 || c.getUTCMinutes(),
            ns: RegExp.$3 || c.getUTCSeconds(),
            na: RegExp.$4 || (c.getUTCHours() - tz >= 12 ? "pm" : "am"),
          }; /*,
			x = _s(".//script[contains(text(), 'var nh = ')]/text()", _d),
			v = /\s(n[hmsa]) = ([""''])?([\w\d]+)\2\;$/gm;

			while (r = v.exec(x)) {
				o[r[1]] = r[3];
			}*/

        return o;
      };

    this.Time = function (is_dynamic) {
      var c = new Date(),
        tz = this.Timezone(),
        o = _o(tz);

      var d = new Date(c),
        h = parseInt(o.nh, 10) + 12 * ("pm" == o.na) + tz;

      d.setUTCHours(h - 24 * (h >= 24), o.nm, o.ns, 0);

      if (is_dynamic) {
        d.setUTCMilliseconds(c - _t);
      }

      return d;
    };
    this.Timezone = function () {
      var c = new Date(),
        o = _o();

      tz =
        (60 * ((24 + c.getUTCHours() - o.nh - 12 * ("pm" == o.na)) % 24) +
          30 * (Math.abs(c.getUTCMinutes() - o.nm) >= 25)) /
        60;

      if (tz != 8) {
        GM_log([
          tz,
          c.getUTCHours(),
          o.nh,
          12 * ("pm" == o.na),
          c.getUTCMinutes(),
          o.nm,
        ]);
      }

      if (isNaN(tz)) {
        tz = 8;

        var s = new Date(c.getFullYear(), 2, 8).getDay() + 1,
          i = new Date(c);

        i.setHours(2, 0, 0);
        i.setMonth(2, 7 + s); // 2nd sunday of march

        var f = new Date(i);
        f.setMonth(10, s); // 1st sunday of november

        if (i <= c && c < f) {
          // daylight saving time
          tz -= 60;
        }
      }

      return tz;
    };
    this.Username = function () {
      return (
        (/([^=]+)$/.test(
          _s("id('header')//a[contains(@href, '?user=')]/@href")
        ) &&
          RegExp.$1) ||
        ""
      );
    };
    this.Language = function () {
      return (
        (/var nl = ([""''])?(\w{1,})\1\;$/m.test(
          _s(".//script[contains(text(), 'var nl = ')]/text()")
        ) &&
          RegExp.$2) ||
        _s(".//select[@name = 'lang']/option[@selected]/@value") ||
        (/\blang=(\w+)\b/.test(document.cookie) && RegExp.$1) ||
        "en"
      );
    };
    this.Theme = function () {
      return (
        (/\/themes\/([\d\w_]+)/.test(
          _s(
            ".//link[contains(@href, '/themes/')]/@href | .//img[contains(@src, '/themes/')][1]/@src"
          )
        ) &&
          RegExp.$1) ||
        "000_def_f65b1"
      );
    };
    this.Neopoints = function () {
      return _n(
        "id('header')//td/a[contains(@href, '?type=inventory')]/text()"
      );
    };
    this.Neocredits = function () {
      return _n(
        "id('header')//td/a[contains(@href, 'mall/index.phtml')]/text()"
      );
    };
    this.ActivePet = function () {
      var health = _s(
        ".//td[@class = 'activePetInfo']//tr[2]/td[2]/descendant::text()"
      ).split(/\s+\/\s+/);

      return {
        Name: _s(".//a[contains(@href, 'quickref.phtml')]/descendant::text()"),
        Species: _s(
          ".//td[@class = 'activePetInfo']//tr[1]/td[2]/descendant::text()"
        ),
        Health: [parseInt(health[0], 10) || 0, parseInt(health[1], 10) || 0],
        Mood: _s(
          ".//td[@class = 'activePetInfo']//tr[3]/td[2]/descendant::text()"
        ),
        Hunger: _s(
          ".//td[@class = 'activePetInfo']//tr[4]/td[2]/descendant::text()"
        ),
        Age: _n(
          ".//td[@class = 'activePetInfo']//tr[5]/td[2]/descendant::text()"
        ),
        Level: _n(
          ".//td[@class = 'activePetInfo']//tr[6]/td[2]/descendant::text()"
        ),
      };
    };
    this.Neofriends = function () {
      var nfs = [];

      var fs = xpath(
        ".//td[@class='neofriend']//tr[position() mod 2 = 1]/td/div[2]/text()[2]",
        _d
      );

      for (var ai = 0, at = fs.length; ai < at; ++ai) {
        var d = new Date(_t);
        d.setSeconds(
          -eval(
            fs[ai].textContent
              .replace(/^\s+|\s+$|\s+\|\s?/g, "")
              .replace(/hrs?/, " * 3600 + ")
              .replace(/mins?/, " * 60 + ")
              .replace(/secs?/, " + ") + "0"
          )
        );

        nfs.push({
          Avatar:
            fs[ai].parentNode.parentNode.parentNode.cells[0].childNodes[0].src,
          Username:
            (/([^=]+)$/.test(
              fs[ai].parentNode.previousSibling.childNodes[1].href
            ) &&
              RegExp.$1) ||
            "",
          Online: d,
        });
      }

      return nfs;
    };
  })(doc);
};
