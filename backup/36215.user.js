// ==UserScript==
// @name           Neopets : SSW Test
// @namespace      http://gm.wesley.eti.br
// @include        http://www.neopets.com/inventory.phtml
// @version        1
// @require        http://userscripts.org/scripts/source/56489.user.js
// @icon           http://i40.tinypic.com/33oi6hz.png
// ==/UserScript==

var params = {
	text	: "main codestone",
};

HttpRequest.open({
	method		: "post",
	url			: "http://www.neopets.com/shops/ssw/ssw_query.php",
	headers		: {
		"Referer" : "http://www.neopets.com/market.phtml?type=wizard",
	},
	onsuccess	: function (params) {
		/*var res = {};
		try {
			res = JSON.parse(params.response.text);
		} catch (e) { }*/

		document.head.parentNode.removeChild(document.head);
		document.body.innerHTML = "<b>Copy the following text and send it to w35l3y:</b><br />" + params.response.text;
	}
}).send({
	q			: params.text,
	priceOnly	: "0",
	context		: "0",	// 0=shop 1=gallery
	partial		: (typeof params.is_exact == "undefined" || params.is_exact?"0":"1"),
	min_price	: parseInt(("" + params.min_price).replace(/[,.]+/g, "").substr(0, 5), 10) || 0,
	max_price	: parseInt(("" + params.max_price).replace(/[,.]+/g, "").substr(0, 5), 10) || 99999,
	json		: "1",
});
