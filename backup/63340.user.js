// ==UserScript==
// @name           Includes : Neopets : Kadoatery
// @namespace      https://gm.wesley.eti.br/includes/neopets
// @description    Kadoatery Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2009+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        1.0.0.6
// @language       en
// @include        nowhere
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @icon           https://gm.wesley.eti.br/icon.php?desc=63340
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
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

Kadoatery = function () {};

Kadoatery.convert = function (doc, type) {
  var output;

  switch (type) {
    case "feed_kadoatie":
      output = {
        Name:
          xpath("string(.//td[@class='content']/div[1]/strong[2])", doc) || "",
        Feeder: xpath("string(.//td[@class='content']/div/a[1])", doc) || "",
        Item:
          xpath(
            "string(.//td[@class='content']/div[img[contains(@src, '/items/')]]/strong[4])",
            doc
          ) || "",
        Total: NaN,
      };
      if (!output.Item)
        output.Total = parseInt(
          xpath(
            "string(.//td[@class='content']/div[1]/strong[4])",
            doc
          ).replace(/[,.]+/g, ""),
          10
        );
      break;
    default:
      output = { list: [] };

      xpath(
        ".//td[@class='content']/div[1]/table/tbody/tr/td/a[img]",
        doc
      ).forEach(function (kad) {
        var b = xpath(".//strong", kad.parentNode),
          not_fed = b[1].parentNode.tagName.toUpperCase() == "TD";

        output.list.push({
          Link:
            (/^http:/.test(kad.href)
              ? ""
              : "https://www.neopets.com/games/kadoatery/") + kad.href,
          Name: b[0].textContent,
          Feeder: not_fed ? "" : b[1].textContent,
          Item: not_fed ? b[1].textContent : "",
        });
      });
      break;
  }

  return output;
};

Kadoatery.feed = function (params) {
  if (
    !/^http:\/\/www\.neopets\.com\/games\/kadoatery\/feed_kadoatie\.phtml/.test(
      params.link
    )
  )
    alert(
      "[Includes : Neopets : Kadoatery : feed]\nParameter 'link' is wrong/missing."
    );
  else
    HttpRequest.open({
      method: "get",
      url: params.link,
      onsuccess: function (params) {
        var obj = Kadoatery.convert(params.response.xml, "feed_kadoatie") || {};

        for (var p in params.parameters) obj[p] = params.parameters[p];

        obj.response = params.response;

        if (typeof params.onsuccess == "function") params.onsuccess(obj);
      },
      parameters: params,
    }).send();
};

if (/^#(?:alert|console)$/.test(location.hash)) {
  var output = [];

  if (/^\/games\/kadoatery(\/|\/index\.phtml)?$/.test(location.pathname)) {
    Kadoatery.convert(document).list.forEach(function (kad) {
      output.push([kad.Link.match(/\d+$/), kad.Name, kad.Feeder, kad.Item]);
    });
  } else if (
    /^\/games\/kadoatery\/feed_kadoatie\.phtml/.test(location.pathname)
  ) {
    Kadoatery.convert(document, "feed_kadoatie").forEach(function (kad) {
      output.push(kad);
    });
  }

  (location.hash == "#alert" ? alert : (console && console.log) || GM_log)(
    output.join("\n")
  );
}
