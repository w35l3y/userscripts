// ==UserScript==
// @name           Orkut : PHP Code Highlight
// @namespace      http://gm.wesley.eti.br/orkut
// @description    Highlights php codes
// @version        1.0.2.12
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      w35l3y 2009
// @license        GNU GPL
// @homepage       http://www.wesley.eti.br
// @include        http*://www.orkut.tld/CommMsgs?cmm=*
// @include        http*://www.orkut.tld/Scrapbook*
// @include        http*://www.orkut.tld/Home*
// @include        http*://www.orkut.tld/Profile?*
// @include        http*://www.orkut.tld/Messages?msg=*
// @include        http*://www.orkut.tld/ProfileT?uid=*
// @include        http*://orkut.tld/CommMsgs?cmm=*
// @include        http*://orkut.tld/Scrapbook*
// @include        http*://orkut.tld/Home*
// @include        http*://orkut.tld/Profile?*
// @include        http*://orkut.tld/Messages?msg=*
// @include        http*://orkut.tld/ProfileT?uid=*
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
// @icon           http://gm.wesley.eti.br/icon.php?desc=38981
// @resource       highlight http://shjs.sourceforge.net/sh_style.css?v1
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        http://shjs.sourceforge.net/sh_main.min.js?v1
// @require        http://shjs.sourceforge.net/lang/sh_php.min.js?v1
// @require        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page1/38788.user.js
// @cfu:meta       https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/@cfu:id.user.js
// @cfu:url        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/@cfu:id.user.js
// @cfu:id         uso:script
// @cfu:version    version
// @cfu:timestamp  modified
// @cfu:interval   5 days
// @modified       11:01 29/09/2009
// @uso:script     38981
// ==/UserScript==

/**************************************************************************

    Author's NOTE

    Special thanks to a friend of mine, Philipe Maia.
    He has been contributed to solve some CSS issues.

***************************************************************************

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

GM.addStyle(GM.getResourceText('highlight'));

(function()
{    // script scope
/*
    /CommMsgs?cmm=*        id('mboxfull')/table/tbody/tr[2]/td[1]/div[position()<last()]/div[2]
    /Scrapbook*            id('mboxfull')/table[2]/tbody/tr[2]/td[1]/form[1]/div/div
    /Home*                 id('mbox')/table[3]/tbody/tr[2]/td[1]/div/div
    /Profile?*             id('app_content_testimonials')/div/div[2]
    /Messages?msg=*        id('f')/table/tbody/tr[2]/td[1]/div[5]/div/div[6]
    /ProfileT?uid=*        id('mboxfull')/table/tbody/tr[2]/td[1]/div/div
*/
    var replies = document.evaluate("id('mboxfull')/table/tbody/tr[2]/td[1]/div[position()<last()]/div[2]|id('mboxfull')/table[2]/tbody/tr[2]/td[1]/form[1]/div/div|id('mbox')/table[3]/tbody/tr[2]/td[1]/div/div|id('app_content_testimonials')/div/div[2]|id('f')/table/tbody/tr[2]/td[1]/div[5]/div/div[6]|id('mboxfull')/table/tbody/tr[2]/td[1]/div/div", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for ( var reply , i = replies.snapshotLength ; reply = replies.snapshotItem(--i) ; )
    {
        var output = "";
        var lines = reply.innerHTML.split(/<br(?:\s*\/)?>/);
        var tabs = [0,0];
        for ( var ai = 0 , at = lines.length ; ai < at ; ++ai )
        {
            var x = [lines[ai].split("{").length, lines[ai].split("}").length];
            tabs[0] += x[0] - x[1];

            // this is a workaround for the "} else {" case
            // Math.max(0, tabs[0] - (x[0] > 1 && /^}/.test(lines[ai]) && x[0] == x[1] ? 1 : 0))
            for ( var bi = (x[0] > x[1] ? tabs[1] : Math.max(0, tabs[0] - (x[0] > 1 && /^}/.test(lines[ai]) && x[0] == x[1] ? 1 : 0))) ; bi ; --bi )
                output += "&nbsp;&nbsp;&nbsp;&nbsp;";
            output += lines[ai] + "<br />";

            if (tabs[1] != tabs[0])
                tabs[1] = tabs[0];
        }

        reply.innerHTML = output
                .replace(/\t+/gm,'')
                .replace(/(?!\[{2})\[code\](?:(?:<br(?:\s*\/)?>)+)?(|[^]+?)((?:<br(?:\s*\/)?>)+)?\[\/code\]/gi,'<fieldset style="border:1px #000000 solid;"><legend>[&nbsp;Code&nbsp;]</legend>$1</fieldset>')
                .replace(/(?:&lt;?|<)\?((?:php|=|(?!(?:xml|>|&gt;?)))(?:[^]*?(?:<br(?:\s*\/)?>)?)?)((?:|[^]+?))(<br(?:\s*\/)?>)?\?(?:&gt;?|>)/gi,'<pre class="sh_php" style="display:inline; white-space:pre-wrap;">&lt;?$1<span style="background-color:inherit; display:inline-block;">$2</span>$3?&gt;</pre>')
                .replace(/(?:<br(?:\s*\/)?>){3,}/gi,'<br /><br />')
                //.replace(/</g,'&lt;') // debug
    }
})();

sh_highlightDocument();