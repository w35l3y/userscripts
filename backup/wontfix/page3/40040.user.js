// ==UserScript==
// @name           Userscripts : Sticky Topics
// @namespace      http://gm.wesley.eti.br/userscripts
// @description    Hides Sticky topics or applies a different background color to it according to its recent activity
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      w35l3y 2008
// @license        GNU GPL
// @homepage       http://www.wesley.eti.br
// @version        1.0.0.2
// @include        http://userscripts-mirror.org/forums/*
// @include        http://userscripts-mirror.org/scripts/discuss/*
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
// @icon           http://gm.wesley.eti.br/icon.php?desc=40040
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page1/38788.user.js
// @cfu:meta       https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/@cfu:id.user.js
// @cfu:url        https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/@cfu:id.user.js
// @cfu:id         uso:script
// @cfu:version    version
// @uso:script     40040
// @uso:timestamp  01:02 01/15/2009
// ==/UserScript==

typeof(CheckForUpdate)!='undefined' && CheckForUpdate.init(GM_info.scriptMetaStr);

(function()
{    // script scope

    var topics = document
    .evaluate("id('content')/table/tbody/tr[td[2]/strong]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    if (topics.snapshotLength)
    {
        async function displayTopics(topics, link)
        {
            var isHidden = !link.textContent && await GM.getValue('isHidden', true) || /^Un/.test(link.textContent);
            link.textContent = ( isHidden ? 'H' : 'Unh' ) + 'ide topics'; // Hide/Unhide topics
    
            for ( var topic, i = topics.snapshotLength ; topic = topics.snapshotItem(--i) ; )
            {
                topic.style.backgroundColor = '#F6F6F6';

                if (/grey/.test(topic.cells[0].childNodes[1].getAttribute('class')))    // no recent activity
                    topic.style.display = ( isHidden ? 'table-row' : 'none' );
            }

            await GM.setValue('isHidden', isHidden);
        }

        var ahide = document.createElement('a');
        ahide.setAttribute('class', 'utility');
        ahide.setAttribute('href', '#');
        ahide.addEventListener('click', function(e)
        {
            displayTopics(topics, e.target);

            e.preventDefault();
        }, false);

        var phide = document.createElement('p');
        phide.setAttribute('style', 'float:right; margin-top:0pt; margin-left:10pt;');
        phide.appendChild(ahide);

        var subtitle = document
        .evaluate("id('content')/p[@class='subtitle']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue;

        subtitle.parentNode.insertBefore(phide, subtitle.nextSibling);

        displayTopics(topics, ahide);
    }
})();