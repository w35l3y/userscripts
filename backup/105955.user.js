// ==UserScript==
// @name           Neopets : Altador Cup : Improved Standings
// @namespace      http://gm.wesley.eti.br
// @description    Improves Standings page
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2013+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        2.1.0
// @language       en
// @include        http://www.neopets.com/altador/colosseum/standings.phtml
// @include        http://www.neopets.com/altador/colosseum/schedule.phtml?day=*&team=all
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @icon           http://gm.wesley.eti.br/icon.php?desc=105955
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
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

(async function () {
    var sum = JSON.parse(await GM.getValue("sum", "{}")),
    rounds = ["first", "second", "third", "fourth"];

    if ("/altador/colosseum/schedule.phtml" == location.pathname) {
        if (/day=([a-z]+)/.test(location.search) && "all" != RegExp.$1) {
            var day = RegExp.$1,
            list = xpath("id('schedule')/div/table/tbody/tr[td[img[contains(@src, '/vs.')]]]");

            sum[day] = {};

            for (var ai = list.length - 1;~ai;--ai) {
                var rteams = xpath("./td[img[contains(@src, '/vs.')]]/img[@onclick]", list[ai]).map(function ($0) {
                    return {
                        id        : (/\((\d+)\)/.test($0.getAttribute("onclick")) && RegExp.$1),
                        name    : (/(\w+)_\d/.test($0.getAttribute("src")) && RegExp.$1),
                    };
                }),
                rgoals = xpath("./td[.//img[@width = 45]]/text()[position() = last()]", list[ai]);
                rteams.forEach(function (rt) {
                    if (!(rt.name in sum[day])) {
                        sum[day][rt.name] = [];
                        for (var bi = rgoals.length;bi--;) {
                            sum[day][rt.name].push({
                                goals    : 0,
                                stats    : [0, 0, 0],
                            });
                        }
                    }
                });
                for (var bi in rgoals) {
                    if (/(\d+) - (\d+)/.test(rgoals[bi].textContent)) {
                        var g0 = parseInt(RegExp.$1, 10),
                        g1 = parseInt(RegExp.$2, 10),
                        p0 = (g1 > g0?2:~~(g0 == g1));

                        sum[day][rteams[0].name][bi].goals += g0;
                        ++sum[day][rteams[0].name][bi].stats[p0];

                        sum[day][rteams[1].name][bi].goals += g1;
                        ++sum[day][rteams[1].name][bi].stats[2 - p0];
                    }
                }
            }

            await GM.setValue("sum", JSON.stringify(sum));

            console.log(sum);
        }
    } else {
        var totals = {};
        xpath(".//div[@class = 'standingModMiddle']//td/b|.//div[@class = 'standingTrophyDiv']").forEach(function (team) {
            if (/([\w ]+)\s+\((\d+)\)/.test(team.textContent) || /([\w ]+)\s+(\d+)/.test(team.textContent)) {
                totals[RegExp.$1.trim()] = parseInt(RegExp.$2.trim(), 10);
            }
        });

        xpath(".//div[@class = 'standingBracketPoints' and b[not(text())]]").forEach(function (points) {
            var team = points.parentNode.textContent.trim();

            points.firstElementChild.textContent = totals[team] - xpath("sum(.//div[@class = 'standingBracketPoints' and b[text()] and preceding-sibling::div[@class = 'standingBracketName' and b[text() = '" + team + "']]]/b/text())");
        });

        xpath(".//div[@class = 'standingMod' and .//table[@class = 'standingBracketMiddle']]").forEach(function (roundNode) {
            var roundNumber = /round-(\d+)/.test(xpath("string(.//div[@class = 'standingModTitle']/@style)", roundNode)) && (RegExp.$1 - 1);

            xpath(".//div[@class = 'standingBracketLogo']", roundNode).forEach(function (teamNode) {
                var id = /(\w+)_\d/.test(teamNode.getAttribute("style")) && RegExp.$1,
                sup = document.createElement("sup");

                sup.textContent = (id && sum[rounds[roundNumber]] && sum[rounds[roundNumber]][id]?sum[rounds[roundNumber]][id].reduce(function (previous, current) {
                    return previous + current.goals;
                }, 0):0);

                teamNode.nextElementSibling.firstElementChild.textContent += " ";
                teamNode.nextElementSibling.appendChild(sup);
            });
        });
    }
})();
