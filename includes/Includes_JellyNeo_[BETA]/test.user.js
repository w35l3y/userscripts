// ==UserScript==
// @name        Test : JellyNeo
// @namespace   http://gm.wesley.eti.br
// @include     https://github.com/w35l3y/userscripts/tree/master/includes/Includes_JellyNeo_%5BBETA%5D
// @version     1
// @grant       GM_xmlhttpRequest
// @require     ../Includes_XPath/63808.user.js
// @require     ../Includes_HttpRequest/56489.user.js
// @require     101685.user.js
// ==/UserScript==

JellyNeo.shops({
	callback	: function (obj) {
		console.log(obj);
	}
});