// ==UserScript==
// @name        GitHub : Missing Readme
// @namespace   http://gm.wesley.eti.br
// @description Updates the README.md for the current folder
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2014+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     http*://github.com/*/userscripts/tree/master/scripts/*
// @resource    template ./README-template.md
// @require     https://github.com/michael/github/raw/master/lib/underscore-min.js
// @require     http://pastebin.com/raw.php?i=FY7MDpMa
// @require     https://github.com/michael/github/raw/master/github.js
// @require     ../../includes/292725.user.js
// @require     ../../includes/288385.user.js
// @require     ../../includes/176400.user.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// ==/UserScript==

//GM_setValue("oauth", ""); // https://github.com/settings/tokens/new (execute this row once)

function processMeta (data) {
	var obj = {},
	re = /^\/\/\s+@([\w:]+)\s+(.+)/gim;
	while (re.exec(data)) {
		obj[RegExp.$1.toLowerCase()] = RegExp.$2;
	}
	return obj;
}

var files = Array.prototype.slice.apply(document.querySelectorAll("td.content a"));
for each (var file in files) {
	if (/\.user\.js$/.test(file.textContent)) {
		if (/^\/(\w+)\/(\w+)\/tree\/(\w+)\/(.+)/.test(location.pathname)) {
			var id = file.id.split("-"),
			info = {
				Username	: RegExp.$1,
				Reponame	: RegExp.$2,
				Branch		: RegExp.$3,
				Path		: RegExp.$4,
				Sha			: id[1],
				File		: file.textContent.replace(/(?:\.\w{2,4}){1,2}$/, ""),
			};

			var github = new Github({
			  token: GM_getValue("oauth", "OAUTH_TOKEN"),
			  auth: "oauth",
			}),
			repo = github.getRepo(info.Username, info.Reponame);

			repo.getBlob(info.Sha, function (err, data) {
				var content = Template.get(GM_getResourceText("template"), {
					meta	: processMeta(data),
					info	: info,
					raw		: "../../../raw/" + info.Branch + "/" + info.Path + "/" + file.textContent,
					sshots	: files.filter(function (a) {
								return /\.(?:jpg|png|gif)$/i.test(a.href);
							}).map(function (a) {
								return {
									node	: a,
									name	: a.textContent.replace(/\.\w+$/, ""),
								};
							}),
				});
				
				if (confirm(content)) {
					var f = info.Path + "/README.md";
					repo.write(info.Branch, f, content, "Updated default " + f, function (err) {
						if (err) {
							alert(JSON.stringify(err));
						} else {
							alert(f + " updated sucessfully.");
						}
					});
				}
			});
		}
		break;
	}
}
