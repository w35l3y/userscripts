// ==UserScript==
// @name           Includes : Neopets : NeopianShop
// @namespace      https://gm.wesley.eti.br
// @description    NeopianShop Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2015+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br/
// @version        1.0.0
// @language       en
// @include        nowhere
// @exclude        *
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @require        https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
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

var NeopianShop = function (page) {
  var _request = function (method, url, referer, data, cb, delay) {
      page.request({
        method: method,
        action: url,
        referer: referer,
        data: data,
        delay: delay || true,
        callback: cb,
      });
    },
    _post = function (url, referer, data, cb, delay) {
      _request("post", url, referer, data, cb, delay || [1000, 500]);
    },
    _get = function (url, referer, cb, delay) {
      _request("get", url, referer, null, cb, delay);
    },
    locateCaptcha = function (url, referer, cb, cbxy) {
      if (cbxy instanceof Array) {
        cb({
          x: cbxy[0],
          y: cbxy[1],
        });

        return;
      }

      console.log("Downloading image...");

      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        headers: {
          Referer: referer,
        },
        responseType: "arraybuffer",
        onload: function (xhr) {
          var img = new Image();
          img.addEventListener(
            "load",
            function (e) {
              var canvas = document.createElement("canvas").wrappedJSObject,
                ctx = canvas.getContext("2d");
              canvas.width = e.target.width;
              canvas.height = e.target.height;
              ctx.drawImage(e.target, 0, 0);

              var r = cbxy(
                ctx.getImageData(0, 0, e.target.width, e.target.height)
              );
              e.target.setAttribute("title", r.x + " x " + r.y);
              cb(r);
            },
            false
          );
          img.addEventListener(
            "error",
            function (e) {
              cb({
                x: -1,
                y: -1,
              });
            },
            false
          );
          img.src =
            "data:image/jpg;base64," +
            btoa(String.fromCharCode.apply(null, new Uint8Array(xhr.response)));

          img.setAttribute("ismap", "ismap");
          img.setAttribute("border", "0");
          var alink = document.createElement("a");
          alink.setAttribute("href", "#");
          alink.appendChild(img);
          document.body.insertBefore(alink, document.body.firstChild);
        },
      });
    },
    parseHaggle = function (o) {
      var captcha = xpath(
        "string(.//input[contains(@src, 'captcha_show.phtml?_x_pwned')]/@src)",
        o.body
      );
      if (captcha) {
        o.result = {
          status: 0, // haggle
          captcha: captcha,
          message: xpath(
            "normalize-space(.//td[@class = 'content']/font/b[4]/text())",
            o.body
          ),
          price: parseInt(
            xpath(
              "normalize-space(.//td[@class = 'content']/font/b[contains(., \"'\") and position() = last()]/text())",
              o.body
            ).replace(/\D+/g, ""),
            10
          ),
          found: !xpath(
            "boolean(.//td[@class = 'content']/form/center/div/font/font)",
            o.body
          ),
          sold: false,
        };
      } else if (
        xpath("boolean(.//td[@class = 'content']/font/b/b/text())", o.body)
      ) {
        // bought
        o.result = {
          status: 1, // bought
          item: {
            name: xpath(
              "normalize-space(.//td[@class = 'content']/div[2]/b/text())",
              o.body
            ),
            image: xpath(
              "normalize-space(.//td[@class = 'content']/div[1]/img[2]/@src)",
              o.body
            ),
          },
          message: xpath(
            "normalize-space(.//td[@class = 'content']/div[2])",
            o.body
          ),
          price: parseInt(
            xpath(
              "normalize-space(.//td[@class = 'content']/font/b/b/text())",
              o.body
            ).replace(/\D+/g, ""),
            10
          ),
          found: true,
          sold: true,
        };
      } else {
        // sold
        o.result = {
          status: -1, // sold
          message: xpath(
            "normalize-space(.//td[@class = 'content']/div/font/b/text())",
            o.body
          ),
          sold: true,
        };
      }
      return o;
    },
    ShopItem = function (node, shopUrl) {
      var haggleUrl = "https://www.neopets.com/";
      if (
        /this.href=([^;]+);/.test(
          node.firstElementChild.getAttribute("onclick").replace(/['+]+/g, "")
        )
      ) {
        haggleUrl += RegExp.$1;
      } else {
        throw "Wrong url";
      }

      var texts = xpath("./text()", node).map(function (item) {
        return parseInt(item.textContent.replace(/\D+/g, ""), 10);
      });

      Object.defineProperties(this, {
        url: {
          value: haggleUrl,
        },
        id: {
          value: parseInt(haggleUrl.match(/obj_info_id=(\d+)/)[1], 10),
        },
        name: {
          get: function () {
            return node.firstElementChild.nextElementSibling.textContent;
          },
        },
        image: {
          value: node.firstElementChild.firstElementChild.src.replace(
            /^http:\/\/images\.neopets\.com\/items\/|\.gif$/g,
            ""
          ),
        },
        stock: {
          value: texts[0],
        },
        cost: {
          value: texts[1],
        },
      });

      var _this = this,
        latestHaggle = {};

      this.haggle = function (obj) {
        if (obj.force || !latestHaggle.captcha) {
          console.log("HAGGLE 0", haggleUrl, this.item);
          _get(
            haggleUrl,
            shopUrl,
            function (o) {
              parseHaggle(o);
              latestHaggle = o.result;
              obj.callback.call(_this, o);
            },
            obj.delay || [1000, 800]
          );
        } else {
          console.log("HAGGLE 1", latestHaggle.captcha);
          locateCaptcha(
            latestHaggle.captcha,
            haggleUrl,
            function (result) {
              if (-1 == result.x || -1 == result.y) {
                obj.callback.call(_this, {
                  result: {
                    status: -2, // error
                    message: "Error loading captcha",
                    sold: false,
                  },
                });
              }

              if (typeof obj.price == "function") {
                obj.offer = obj.price(o.result.price);
              }

              result.current_offer = obj.offer || latestHaggle.price;

              console.log("RESULT", result);
              _post(
                haggleUrl,
                haggleUrl,
                result,
                function (o) {
                  parseHaggle(o);
                  latestHaggle = o.result;
                  obj.callback.call(_this, o);
                },
                obj.delay
              );
            },
            obj.captcha ||
              function (imgdata) {
                var low = [0, 0, 120],
                  rnd = 15 + Math.floor(3 * Math.random()),
                  xxi = Math.floor(imgdata.width / 2),
                  mdy = Math.floor(imgdata.height / 2),
                  yt = imgdata.height - rnd,
                  curr = new Date();
                for (
                  var xi = 0, xt = imgdata.width - rnd;
                  xi < xt;
                  xi += 4, xxi += xi * (xi % 8 ? 1 : -1)
                ) {
                  for (
                    var yi = 0, yyi = mdy;
                    yi < yt;
                    yi += 4, yyi += yi * (yi % 8 ? 1 : -1)
                  ) {
                    var index = 4 * (xxi + yyi * imgdata.width),
                      avg = Math.floor(
                        (imgdata.data[index] +
                          imgdata.data[1 + index] +
                          imgdata.data[2 + index]) /
                          3
                      ); // (red+green+blue)/3

                    if (low[2] > avg && avg > 30) {
                      low = [xxi, yyi, avg];
                      if (70 > avg) {
                        break;
                      }
                    }
                  }
                }
                console.debug("Pet found!", new Date() - curr, low);

                return {
                  x: low[0],
                  y: low[1],
                };
              }
          );
        }
      };

      this.buy = function (obj) {
        this.haggle({
          force: true,
          delay: [1000, 500],
          callback: function (o) {
            if (o.result.status) {
              obj.callback(o);
              return;
            }
            obj.force = false;
            this.haggle(obj);
          },
        });
      };
    };

  this.list = function (obj) {
    var url =
        "https://www.neopets.com/objects.phtml?type=shop&obj_type=" + obj.id,
      curr = new Date();
    console.log("Retrieving list...");
    _get(url, url, function (o) {
      console.log("Parsing list...", new Date() - curr);
      curr = new Date();
      var missing = [],
        tmpKey = "",
        items = xpath(
          ".//form[@name = 'items_for_sale']//td[@class = 'contentModuleContent']//td[a[img]]",
          o.body
        );

      obj.callback({
        result: {
          message: items.length
            ? items.length + " items found."
            : xpath(
                "normalize-space(.//td[@class = 'content']/center[2]/text())",
                o.body
              ),
          list: items.map(function (item) {
            var it = new ShopItem(item.cloneNode(true), url),
              qItem = function (item) {
                return item.id == it.id || item.image == it.image;
              };
            tmpKey += it.id;

            Object.defineProperties(it, {
              item: {
                get: function () {
                  var itemDb = NeopianShop.cachedItems[this.id];
                  if (!itemDb) {
                    itemDb = page.database.queryAll("items", {
                      query: qItem,
                      limit: 1,
                    })[0];

                    if (itemDb) {
                      itemDb.isNew = false;
                      var upd = false;
                      if (!itemDb.id) {
                        itemDb.id = this.id;
                        upd = true;
                      }
                      if (!itemDb.name) {
                        itemDb.name = this.name;
                        upd = true;
                      }
                      if (!itemDb.image) {
                        itemDb.image = this.image;
                        upd = true;
                      }
                      /*if (!itemDb.price) {
											itemDb.price = this.cost;
											upd = true;
										}*/
                      if (upd) {
                        missing.push(itemDb.image);
                        page.database.update("items", qItem, function () {
                          return itemDb;
                        });
                      }
                    } else {
                      missing.push(this.image);
                      itemDb = {
                        id: this.id,
                        name: this.name,
                        image: this.image,
                        //							price	: this.cost,
                        isNew: true,
                      };
                      itemDb.ID = page.database.insert("items", itemDb);
                      console.log("New item...", itemDb, this);
                    }

                    NeopianShop.cachedItems[itemDb.id] = itemDb;
                  }

                  return itemDb;
                },
              },
            });

            return it;
          }),
          key: tmpKey,
        },
      });
      console.log("ITEMS", missing.toSource());
      missing.length && page.database.commit();
      console.log("List parsed", new Date() - curr);
    });
  };
};
NeopianShop.cachedItems = {};
