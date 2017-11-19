// ==UserScript==
// @name           Examples : Metadata block reader
// @namespace      http://gm.wesley.eti.br/examples
// @include        http://userscripts-mirror.org/scripts/show/85476
// @resource       meta 85476.user.js
// @grant          GM_getResourceText
// @grant          GM.getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=85476
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

(async function () {
    var content = await GM.getResourceText("meta").match(/^\/\/ ==UserScript==([^]+)\/\/ ==\/UserScript==$/m)[1],key,value,re = /^\/\/ @([^\s]+)\s+(.+)/gm;
    while ([,key,value] = re.exec(content))
    alert([key,value]);
})();