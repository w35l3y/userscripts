// ==UserScript==
// @name           Userscripts : Mark as read
// @namespace      http://gm.wesley.eti.br/userscripts
// @description    Displays the option to mark discussions as read
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      w35l3y 2008
// @license        GNU GPL
// @homepage       http://www.wesley.eti.br
// @include        http://userscripts-mirror.org/topics/*
// @include        http://userscripts-mirror.org/forums/*
// @include        http://userscripts-mirror.org/forums
// @include        http://userscripts-mirror.org/scripts/discuss/*
// @grant          GM_log
// @grant          GM.log
// @grant          GM_addStyle
// @grant          GM.addStyle
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_openInTab
// @grant          GM.openInTab
// @grant          GM_deleteValue
// @grant          GM.deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM.xmlHttpRequest
// @grant          GM_getResourceText
// @grant          GM.getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=39024
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page1/38788.user.js
// @cfu:meta       https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/@cfu:id.user.js
// @cfu:url        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/@cfu:id.user.js
// @cfu:id         uso:script
// @cfu:version    uso:version
// @uso:script     39024
// @uso:version    1.0.4.1
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

typeof(CheckForUpdate)!='undefined' && CheckForUpdate.init(GM_info.scriptMetaStr);

(function()
{    // script scope

    function MarkAsRead(posts, tries)
    {
        if (tries == 3)
        {
            alert('An error has occurred while marking topics as read.');
        }
        else if (posts.length)
        {
            GM.xmlHttpRequest({
                'url':posts[0][0].href,
                'method':'get',
                'onload':function(e)
                {
                    if (/^2/.test(e.status))
                    {
                        if (/\/forums\/\d+/.test(e.finalUrl) && /\/forums$/.test(location.href))
                        {
                            var text = e.responseText.replace(/\s+|<\/td>|<td class="c2">|Sticky: <strong>|, this topic is locked\./gi,'');

                            var total = (text.match(/title="Recentactivity"\/><ahref="\/topics\/\d+"/gi) || []).length;

                            var span;
                            if (!(span = document.getElementById(e.finalUrl)))
                            {
                                span = document.createElement('span');
                                span.setAttribute('id', e.finalUrl);
                                posts[0][0].parentNode.insertBefore(span, posts[0][0].nextSibling);
                            }
                            span.textContent = " (0/"+total+")";

                            for ( var m , i = 1 ; m = /title="Recentactivity"\/><ahref="(\/topics\/\d+)"/gi.exec(text) ; ++i )
                            {
                                var a = document.createElement('a');
                                a.setAttribute('href', 'http://userscripts-mirror.org'+m[1]);
                                posts.push([a, function(e, s, i, t)
                                {
                                    s.textContent = " ("+i+"/"+t+")";
                                }, span, i, total]);
                            }
                        }

                        if (posts[0][1]) // callback
                        {
                            var a = posts[0].slice(2) || [];
                            a.unshift(posts[0][0]);
                            posts[0][1].apply(this, a);
                        }

                        posts.shift();
                        tries = -1;
                    }

                    setTimeout(MarkAsRead, 500, posts, ++tries || 0);
                },
                'onerror':function(e)
                {
                    setTimeout(MarkAsRead, 500, posts, ++tries || 0);
                }
            });
        }
    }

    if (/\/topics\/(?:new\?forum_id=)?\d+/.test(location.href))
    {
        var forum = document
        .evaluate("id('content')/div/a[contains(@href,'/forums/')][1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue;

        if (forum)
        {
            document
            .evaluate("id('new_topic') | id('reply')//form[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            .singleNodeValue
            .addEventListener('submit', function(e)
            {
                GM.setValue('posts', JSON.stringify([forum.href]));
            }, false);

            var posts = JSON.parse(GM.getValue('posts','[]'));
            if (posts.length)
            {
                var read = [];
                var update = function(e)
                {
                    var posts = JSON.parse(GM.getValue('posts','[]'));
                    posts.pop();
                    GM.setValue('posts', JSON.stringify(posts));
                };
                for ( var i = posts.length ; i-- ; )
                {
                    var a = document.createElement('a');
                    a.setAttribute('href', posts[i]);
                    read.push([a, update]);
                }

                MarkAsRead(read);
            }
        }
    }
    else
    {
        var subtitle = document
        .evaluate("id('content')/p[@class='subtitle']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue;

        var posts = document.evaluate("//tr[td/img[contains(@class,'green')]]/td[2]//a", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        if (subtitle && posts.snapshotLength)
        {
            var amark = document.createElement('a');
            amark.setAttribute('class', 'utility');
            amark.setAttribute('href', '#');
            amark.textContent = 'Mark as read';
            amark.addEventListener('click', function(e)
            {
                e.target.parentNode.style.display = "none";

                var read = [];
                var update = function(e)
                {
                    var img = e.parentNode.parentNode;
                    while (!img.cells)
                        img = img.parentNode;

                    img = img.cells[0].childNodes[1];
                    img.setAttribute('class',img.getAttribute('class').replace('green','grey'));
                };
                for ( var i = posts.snapshotLength ; i-- ; )
                {
                    read.push([posts.snapshotItem(i), update]);
                }

                MarkAsRead(read);

                e.preventDefault();
            }, false);

            var pmark = document.createElement('p');
            pmark.setAttribute('style', 'float:right; margin-top:0pt; margin-left:10pt;');
            pmark.appendChild(amark);

            subtitle.parentNode.insertBefore(pmark, subtitle.nextSibling);
        }
    }
})();