// ==UserScript==
// @name        Includes : Neopets : DiceARoo
// @namespace   https://gm.wesley.eti.br
// @description DiceARoo Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (https://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    https://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @icon        https://gm.wesley.eti.br/icon.php?desc=includes/Includes_Neopets_DiceARoo/main.user.js
// @require     https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
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

var DiceARoo = function (page) {
  var stats = ["happy_green", "sad_blue", "happy_blue"],
    dices = ["red", "blue", "green", "yellow", "silver"],
    _post = function (data, cb) {
      var url = "https://www.neopets.com/games/play_dicearoo.phtml";

      page.request({
        method: "post",
        action: url,
        referer: url,
        ck: "_ref_ck",
        data: data,
        delay: [900, 500],
        callback: function (obj) {
          (obj.dice = /\/dice\/(\D+)(\d+)/.test(
            xpath(
              "normalize-space(.//td[@class = 'content']//div/center/img[1][not(following-sibling::img[1]) and contains(@src, '/games/dice/')]/@src)",
              obj.body
            )
          )
            ? [dices.indexOf(RegExp.$1), parseInt(RegExp.$2, 10)]
            : [-1, -1]),
            (obj.type = /\/(\w+)\/blumaroo_(\w+)_/.test(
              xpath(
                "normalize-space(.//td[@class = 'content']//div/center/img[contains(@src, '_baby.gif')]/@src)",
                obj.body
              )
            )
              ? stats.indexOf(RegExp.$1 + "_" + RegExp.$2)
              : -1);
          obj.prize = xpath(
            ".//td[@class = 'content']//div[@class = 'frame']/div/table/tbody/tr[2]/td[.//b and ./img]",
            obj.body
          ).map(function (node) {
            return {
              name: xpath("normalize-space(.//b/text())", node),
              image: xpath("normalize-space(./img/@src)", node).replace(
                /^http:\/\/images\.neopets\.com\/items\/|\.gif$/g,
                ""
              ),
            };
          })[0];

          cb(obj);
        },
      });
    },
    _this = this;

  this.jackpot = function (obj) {
    page.request({
      method: "get",
      action: "https://www.neopets.com/games/dicearoo.phtml",
      referer: "https://www.neopets.com/games/dicearoo.phtml",
      delay: [900, 500],
      callback: function (o) {
        o.dices = [];
        o.prizes = [];
        o.value = parseInt(
          xpath(
            "normalize-space(.//td[@class = 'content']//div[@class = 'frame']/div/center/p/b/text())",
            o.body
          ).replace(/\D+/g, ""),
          10
        );

        obj.callback(o);
      },
    });
  };

  this.play = function (obj) {
    var nDices = [],
      nPrizes = [];
    if (!("continue" in obj)) {
      obj.continue = function () {
        return true;
      };
    }
    _this.start({
      callback: function recursive(o) {
        nDices.unshift(o.dice);
        if (o.prize) {
          nPrizes.unshift(o.prize);
        }

        o.dices = nDices;
        o.prizes = nPrizes;

        if (-1 == o.type && -1 != o.dice[0] && obj.continue(o)) {
          _this.roll({
            callback: recursive,
          });
        } else {
          obj.callback(o);
        }
      },
    });
  };

  this.start = function (obj) {
    _post(
      {
        raah: "init",
        type: "start",
      },
      obj.callback
    );
  };

  this.roll = function (obj) {
    _post(
      {
        raah: "continue",
      },
      obj.callback
    );
  };

  this.collect = function (obj) {
    _post(
      {
        raah: "continue",
        type: "collect",
      },
      obj.callback
    );
  };
};
