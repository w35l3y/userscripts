// ==UserScript==
// @name           Includes : JellyNeo [BETA]
// @namespace      https://gm.wesley.eti.br/includes/jellyneo
// @description    JellyNeo Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        3.0.0
// @language       en
// @include        nowhere
// @exclude        *
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
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

var JellyNeo = function () {};

JellyNeo.shops = function (params) {
  HttpRequest.open({
    method: "get",
    url: "https://www.jellyneo.net/index.php",
    onsuccess: function (xhr) {
      var getQS = function (v) {
        var re = /[&?](\w+)=(\w+)/gi,
          out = {};

        while (re.exec(v)) {
          out[RegExp.$1] = RegExp.$2;
        }

        return {
          raw: v,
          params: out,
        };
      };

      params.callback({
        list: xpath(
          ".//td[a[contains(@href, 'neopets.com')]/br]",
          xhr.response.xml
        ).map(function (shop) {
          var npLink = xpath("./a[contains(@href, 'neopets.com')]", shop)[0];

          return {
            name: npLink.textContent.trim(),
            npLink: getQS(npLink.getAttribute("href")),
            jnLink: getQS(
              xpath(
                "string(./a[contains(@href, 'items.jellyneo')]/@href)",
                shop
              )
            ),
          };
        }),
      });
    },
  }).send({
    go: "shopsdirectory",
  });
};

JellyNeo.ItemDatabase = function () {};

JellyNeo.ItemDatabase.find = function (params) {
  var data = {
      sort: 3,
      sort_dir: "desc",
      limit: 100,
      exclude_nc: 1,
      start: 0,
    },
    total = 0;

  if (!params.pages) {
    params.pages = 0;
  }

  for (let ai in params.data) {
    data[ai] = params.data[ai];
  }

  (function recursive(page, list) {
    HttpRequest.open({
      method: "get",
      url: "https://items.jellyneo.net/search/",
      onsuccess: function (xhr) {
        if (!page) {
          total = parseInt(
            xpath("string(.//div/div/p/b/text())", xhr.response.xml).replace(
              /\D+/g,
              ""
            ),
            10
          );
        }
        var next = xpath(
            "string(.//ul[@class = 'pagination']/li[last()][@class = 'arrow']/a[@href]/@href)",
            xhr.response.xml
          ),
          pageList = xpath(".//ul/li[a/img]", xhr.response.xml).map(function (
            item
          ) {
            var img = xpath(".//img", item)[0],
              href = img.parentNode.getAttribute("href");

            return {
              id: /\bitem\/(\d+)/.test(href) && RegExp.$1,
              link: "https://items.jellyneo.net" + href,
              name: img.getAttribute("title"),
              image: img.getAttribute("src"),
              price: parseInt(
                xpath(
                  "string(.//a[contains(@href, '/price-history/')]/text())",
                  item
                ).replace(/[,.]/g, ""),
                10
              ),
            };
          });

        params.pages &&
          params.each &&
          params.each({
            total: total,
            page: page,
            list: pageList,
            data: data,
          });

        Array.prototype.push.apply(list, pageList);
        if (
          (params.pages === -1 || page < params.pages) &&
          next &&
          /\bstart=(\d+)/.test(next)
        ) {
          data.start = RegExp.$1;

          recursive(++page, list);
        } else {
          params.callback({
            total: total,
            page: page,
            list: list,
            data: data,
          });
        }
      },
    }).send(data);
  })(0, []);
};
