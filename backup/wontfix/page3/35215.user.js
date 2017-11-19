// ==UserScript==
// @name           Userscripts : People Ranking
// @namespace      http://gm.wesley.eti.br/userscripts
// @description    Displays one's position since your last access
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @version        1.0.3
// @copyright      w35l3y 2008
// @license        GNU GPL
// @homepage       http://www.wesley.eti.br
// @include        http://userscripts-mirror.org/users?*
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
// @icon           http://gm.wesley.eti.br/icon.php?desc=35215
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        http://www.wesley.eti.br/includes/js/php.js?v1
// @require        http://www.wesley.eti.br/includes/js/php2js.js?v1
// @require        http://gm.wesley.eti.br/gm_default.js?v1
// @require        http://gm.wesley.eti.br/userscripts/PeopleRanking/peopleranking_default.js?v1
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

checkForUpdate({
    'file':'https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page3/35215.user.js',
    'name':'Userscripts : People Ranking',
    'namespace':'http://gm.wesley.eti.br/userscripts',
    'version':'1.0.3'
});

(async function() {    // script scope

    var user = {
        'pages':await GM.getValue('pages',            5),
        'update': await GM.getValue('update',        Update.Manual),    // != Update.Automatic
        'position':await GM.getValue('position',        Position.Absolute),    // != Position.Relative
        'ranking':await GM.getValue('ranking',        'scripts;comments;posts').toLowerCase().split(';')
    };    

    var script = {
        'username':xpath('string(id("homeBox")/a[contains(@href,"/home")]/text())')
    };

    var qs = {'page':'1'};    
    for ( var m ; m = /[?&](\w+)=(\w+)/g.exec(location.href) ; )
    {
        qs[m[1]] = m[2];
    }

    if (!!qs.sort)
    {
        var cp = parseInt(qs.page,10);

        var header = xpath('//table/tbody/tr[1]/th');
        for ( var column = 0 , t = header.length ; column < t ; ++column )
        {
            if (header[column].textContent.toLowerCase() == qs.sort)
                break;
        }

        if (!user.update)
        {
            xpath('//div[@class="pagination"]').forEach(function(elem)
            {
                var btn = document.createElement('a');
                btn.setAttribute('href',location.href);
                btn.setAttribute('style','float:right;');
                btn.innerHTML='Update rank';
                btn.addEventListener('click', async function(event)
                {
                    var ranking = JSON.parse(await GM.getValue(qs.sort,'{}'));
                    xpath('//table/tbody/tr/td[1]/a').forEach(function(elem, index)
                    {
                        var uid = elem.href.match(/\d+/);
                        if ( uid in ranking && cp <= user.pages)
                            ranking[uid][0] = (cp-1)*50+index;
                        else if ( uid in ranking )
                            delete ranking[uid];

                        var x = elem.parentNode.parentNode.cells[5];
                        if (x.innerHTML != '?')
                        {
                            x.style.backgroundColor = 'inherit';
                            x.innerHTML = ( uid in ranking ? '+0' : '?' );
                        }
                    });
                    await GM.setValue(qs.sort, JSON.stringify(ranking));
                    event.preventDefault();
                }, true);
                elem.insertBefore(btn,elem.firstChild);
            });
        }

        var rank = document.createElement('th');
        rank.innerHTML = '<a>Rank</a>'
        xpath('//table/tbody/tr[1]')[0].appendChild(rank);
        var cp = parseInt(qs.page,10);
        var ranking = JSON.parse(await GM.getValue(qs.sort,'{}'));

        xpath('//table/tbody/tr/td[1]/a').forEach(function(elem, index)
        {
            var uid = elem.href.match(/\d+/);
            var nc = document.createElement('td');
            var c = '?';
            var cv = parseInt(elem.parentNode.parentNode.cells[column].textContent,10);
            if (uid in ranking)
            {
                c = '+0';
                if (!user.position || ranking[uid][1] != cv)
                {
                    if (ranking[uid][0] != (cp-1)*50+index)
                    {
                        c = ('+'+(ranking[uid][0] - (cp-1)*50-index)).replace('+-','-');
                        nc.style.backgroundColor = ( c.indexOf('+') ? '#FFEEEE' : '#EEFFEE' );
                    }

                    if (user.update & Update.Automatic)
                    {
                        if (cp <= user.pages)
                            ranking[uid] = [(cp-1)*50+index,cv];
                        else
                            delete ranking[uid];
                    }
                }
            }
            else if (cp <= user.pages || elem.textContent == script.username)
            {
                c = '+0';
                ranking[uid] = [(cp-1)*50+index,cv];
            }

            nc.setAttribute('title',((cp-1)*50+1+index)+' ('+c+')');
            if (elem.textContent == script.username)
            {
                elem.parentNode.parentNode.style.backgroundColor = '#EEEEFF';
            }
            nc.setAttribute('align','center');
            nc.innerHTML = c;
            elem.parentNode.parentNode.appendChild(nc);
        });

        await GM.setValue(qs.sort, JSON.stringify(ranking));
    }
})();