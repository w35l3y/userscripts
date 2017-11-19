// ==UserScript==
// @name        Test : SWF Decompiler
// @namespace   http://gm.wesley.eti.br
// @include     http://www.showmycode.com/
// @version     1.0.0
// @grant       GM_xmlhttpRequest
// @require     reader.js
// @require     atoj.js
// ==/UserScript==

//BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;

var url = prompt("SWF url");
url && GM_xmlhttpRequest({
	method	: "get",
	overrideMimeType	: "text/plain; charset=x-user-defined",
	url		: url,
	onload	: function (response) {
		//console.log(typeof response.responseText);
		alert(AtoJ.compileActionScript2(response.responseText, {}, 10));
	}
});