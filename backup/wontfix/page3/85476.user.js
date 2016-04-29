// ==UserScript==
// @name           Examples : Metadata block reader
// @namespace      http://gm.wesley.eti.br/examples
// @include        http://userscripts-mirror.org/scripts/show/85476
// @resource       meta 85476.user.js
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=85476
// ==/UserScript==

var content = GM_getResourceText("meta").match(/^\/\/ ==UserScript==([^]+)\/\/ ==\/UserScript==$/m)[1],key,value,re = /^\/\/ @([^\s]+)\s+(.+)/gm;
while ([,key,value] = re.exec(content))
alert([key,value]);