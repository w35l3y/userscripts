// ==UserScript==
// @name        GitHub : Missing Readme
// @namespace   http://gm.wesley.eti.br
// @description Updates the README.md for the folders that contains userscripts (.user.js) in it
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2014+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.1.1
// @language    en
// @include     http*://github.com/*/userscripts/tree/*/scripts*
// @icon        http://gm.wesley.eti.br/icon.php?desc=scripts/GitHub_Missing_Readme/main.user.js#
// @resource    template ./README-template.md
// @resource    templateList ./README-templateList.md
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

if (/^\/(\w+)\/(\w+)\/tree\/(\w+)\/(.+)/.test(location.pathname)) {
	var info = {
		Username	: RegExp.$1,
		Reponame	: RegExp.$2,
		Branch		: RegExp.$3,
		Path		: RegExp.$4,
	},
	repo = new Github({
	  token: GM_getValue("oauth", "OAUTH_TOKEN"),
	  auth: "oauth",
	}).getRepo(info.Username, info.Reponame);
	
	function writeContent (content) {
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
	}

	if ("scripts" == info.Path) {
		repo.getTree(info.Branch + "?recursive=true", function (err, tree) {
			var scripts = [];
			for each (var file in tree) {
				if (/^scripts\/([^_]+)_(\w+)\/((\w+)\.user\.js)$/.test(file.path)) {
					scripts.push({
						file	: file,
						branch	: info.Branch,
						group	: RegExp.$1,
						name	: RegExp.$3,
						sname	: RegExp.$4,
						dir		: RegExp.$2.replace(/_+/g, " "),
					});
				}
			}

			scripts.sort(function (a, b) {
				if (a.group == b.group) {
					if (a.dir == b.dir) {
						return (a.sname > b.sname?1:-1);
					}
					return (a.dir > b.dir?1:-1);
				}
				return (a.group > b.group?1:-1);
			});
			
			writeContent(Template.get(GM_getResourceText("templateList"), {
				files	: scripts,
			}));
		});
	} else {
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
				var id = file.id.split("-");
				info.Sha = id[1];
				info.File = file.textContent.replace(/(?:\.\w{2,4}){1,2}$/, "");

				repo.getBlob(info.Sha, function (err, data) {
					writeContent(Template.get(GM_getResourceText("template"), {
						meta	: processMeta(data),
						info	: info,
						file	: file,
						raw		: "../../../raw/" + info.Branch + "/" + info.Path + "/" + file.textContent,
						sshots	: files.filter(function (a) {
									return /\.(?:jpg|png|gif)$/i.test(a.href);
								}).map(function (a) {
									return {
										node	: a,
										name	: a.textContent.replace(/\.\w+$/, ""),
									};
								}),
					}));
				});

				break;
			}
		}
	}
}
