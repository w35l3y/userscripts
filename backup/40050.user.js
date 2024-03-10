// ==UserScript==
// @name           Includes : Persist
// @namespace      https://gm.wesley.eti.br/includes
// @description    Data persistence function. This script doesn't do anything by its own.
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      w35l3y 2008
// @license        GNU GPL
// @homepage       https://www.wesley.eti.br
// @version        1.0.0.0
// @include        nowhere
// @grant          GM_log
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_openInTab
// @grant          GM_xmlhttpRequest
// @icon           https://gm.wesley.eti.br/icon.php?desc=40050
// @require        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page1/38788.user.js
// @cfu:meta       https://github.com/w35l3y/userscripts/raw/master/backup/@cfu:id.user.js
// @cfu:url        https://github.com/w35l3y/userscripts/raw/master/backup/@cfu:id.user.js
// @cfu:id         uso:script
// @cfu:timestamp  uso:timestamp
// @cfu:version    version
// @uso:script     40050
// @uso:timestamp  10:01 01/08/2009
// ==/UserScript==
typeof CheckForUpdate != "undefined" &&
  CheckForUpdate.init(GM_info.scriptMetaStr);

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

const Persist = {
  set: function (service, data, onLoad, onError) {
    var postData = "";
    for (var name in data)
      postData += "&" + name + "=" + encodeURIComponent(data[name]);

    GM_xmlhttpRequest({
      url: service,
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: postData.substr(1),
      onload: function (e) {
        if (/^2/.test(e.status)) onLoad && onLoad(e);
        else if (onError) onError(e);
      },
      onerror: onError,
    });
  },
  get: function (url, onLoad, onError) {
    GM_xmlhttpRequest({
      url: url,
      method: "get",
      onload: function (e) {
        if (/^2/.test(e.status)) onLoad && onLoad(e);
        else if (onError) onError(e);
      },
      onerror: onError,
    });
  },
};
