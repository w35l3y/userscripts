// ==UserScript==
// @name        GitHub : New Issue
// @namespace   http://gm.wesley.eti.br
// @include     http*://github.com/*/userscripts/issues/new
// @version     1.2
// ==/UserScript==

var values = {
	fx_version	: navigator.userAgent,
	gm_version	: GM_info.version,
},
questions = [
	["name", "Script name"],
	["version", "Script version"],
	["url", "Url"],
	["message", "Error message"],
	["observation", "Observation"],
];
for each (var v in questions) {
	if (!(values[v[0]] = prompt(v[1]))) {
		break;
	}
}
var body = document.getElementById("issue_body");
body.value = "**Browser:** {fx_version}\n**Greasemonkey:** {gm_version}\n**Script:** {name} ({version})\n**Url:** {url}\n**Error Message:** {message}\n**Obs.:** {observation}".replace(/\{(\w+)\}/g, function ($0, $1) {
	return ($1 in values && values[$1]?values[$1]:("%" + $1));
});
body.form.addEventListener("submit", function (e) {
	var s = !/!\[[^\]]+\]\([^\)]+\)/.test(body.value),
	v = /%(\w+)/.test(body.value);

	if (v) {
		alert("Some required values are missing. (" + RegExp.$1 + ")" + (s?"\n\nConsider adding some screenshots too.":""));
	}

	if (v || s && !confirm("Do you want to report an issue without any attachments?")) {
		e.preventDefault();
		e.stopPropagation();
	}
}, false);
