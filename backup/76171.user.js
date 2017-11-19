// ==UserScript==
// @name           Neopets : Tarla's Tour of Mystery 2010
// @namespace      http://gm.wesley.eti.br/neopets
// @description    Finds Tarla and clicks on a prize
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2010+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0.6
// @language       en
// @include        http://www.neopets.com/*
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_openInTab
// @grant          GM.openInTab
// @grant          GM_xmlhttpRequest
// @grant          GM.xmlHttpRequest
// @grant          GM_getResourceText
// @grant          GM.getResourceText
// @grant          GM_registerMenuCommand
// @grant          GM.registerMenuCommand
// @icon           http://gm.wesley.eti.br/icon.php?desc=76171
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets/63810.user.js
// @contributor    jellyneo (http://twitter.com/statuses/user_timeline/42098834.rss)
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

//GM.setValue("auto_prize", true);

var user = xpath("string(id('header')//a[contains(@href, 'userlookup')]/text())");

if (/^(?:.+)$/.test(user))
{
    var prize = xpath(".//a[contains(@id, 'tarla_prize_link_')]", unsafeWindow.document)[0];

    if (prize)
    setTimeout(function()    // setTimeout is needed due to the Referer header
    {
        if (GM.getValue("auto_prize", false))
        {
            var c = unsafeWindow.confirm;
            unsafeWindow.confirm = function(){return true;};
            prize.onclick();
            unsafeWindow.confirm = c;
        }
        else
        prize.onclick();
    }, 600 + Math.floor(500 * Math.random()));
    else if (xpath("boolean(id('tarla2010-pushdown'))"))    // maxed out the number of prizes for today
    {
        var next = new Date(),
        curr = Neopets.convert(document).Time(true);
        next.setHours(24 * (next.getDate() == curr.getDate()), 0, 0, 0);
        GM.setValue("last_access-" + user, new Date(next - curr + new Date().valueOf()).toString());
    }

    (function recursive()
    {
        var current = new Date(),
        last_access = new Date(Date.parse(GM.getValue("last_access-" + user, "May 5 2010 00:00:00 GMT-0300"))),
        interval = 50000;    // 50 seconds

        if (current - last_access > interval)
        {
            GM.setValue("last_access-" + user, (last_access = current).toString());

            GM.xmlHttpRequest({
                "method" : "get",
                "url" : "http://twitter.com/statuses/user_timeline/42098834.rss",
                "onload" : function(xhr)
                {
                    var title = xpath(".//item/title[contains(translate(text(), 'ALRT', 'alrt'), 'tarla') and contains(text(), 'http')]", new DOMParser().parseFromString(xhr.responseText, "text/xml"))[0],
                    current = new Date();
                    if (title && title.textContent != GM.getValue("sighting-" + user) && /(https?:\/\/\S+)/.test(title.textContent))
                    {
                        GM.setValue("last_access-" + user, current.toString());
                        GM.setValue("sighting-" + user, title.textContent);

                        if (current - Date.parse(xpath("string(./ancestor::item[1]/pubDate)", title)) < 1200000)    // current - pubDate < 20 minutes
                        GM.openInTab(RegExp.$1);
                    }
                }
            });
        }

        setTimeout(recursive, last_access - current + interval);
    })();
}

GM.registerMenuCommand("[Neopets : Tarla's Tour of Mystery 2010] Toggle auto-click on prizes", function()
{
    var ap = !GM.getValue("auto_prize", false);
    GM.setValue("auto_prize", ap);
    
    alert("Auto-click is "+(ap?"enabled":"disabled"));
});