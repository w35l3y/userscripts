// ==UserScript==
// @name           Userscripts : code2pre
// @namespace      https://gm.wesley.eti.br/userscripts
// @description    Converts multi-line <code> blocks into <pre> blocks
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2010+, w35l3y (https://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       https://gm.wesley.eti.br
// @version        1.0.0.2
// @language       en
// @include        https://userscripts-mirror.org/topics/*
// @include        https://userscripts-mirror.org/home/comments*
// @grant          GM_log
// @icon           https://gm.wesley.eti.br/icon.php?desc=71124
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
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

**************************************************************************/

xpath(
  ".//code[not(ancestor::pre or ancestor::code) and (descendant::br or contains(descendant::text(), '\n'))]"
).forEach(function (code) {
  var pre = document.createElement("pre");
  pre.innerHTML = code.innerHTML.replace(
    /(?:\r?\n(?=<br(?: ?\/)?>)|^\s+|\s+$)/gi,
    ""
  );
  code.parentNode.replaceChild(pre, code);
});
