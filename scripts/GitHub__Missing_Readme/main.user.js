// ==UserScript==
// @name        GitHub : Missing Readme
// @namespace   http://gm.wesley.eti.br
// @description Updates the README.md for the folders that contains userscripts (.user.js) in it
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2014+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.4.0
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

if (/^\/(\w+)\/(\w+)\/tree\/(\w+)\/(.+)/.test(location.pathname) && confirm("Update README.md?")) {
	var info = {
		Username	: RegExp.$1,
		Reponame	: RegExp.$2,
		Branch		: RegExp.$3,
		Path		: RegExp.$4,
	},
	github = new Github({
	  token: GM_getValue("oauth", "OAUTH_TOKEN"),
	  auth: "oauth",
	}),
	issu = github.getIssues(info.Username, info.Reponame),
	repo = github.getRepo(info.Username, info.Reponame);
	
	function writeContent (content) {
		var f = info.Path + "/README.md";
		repo.write(info.Branch, f, content, "Updated default " + f, function (err) {
			if (err) {
				alert(JSON.stringify(err));
			} else {
				alert(f + " updated sucessfully.");
			}
		});
	}

	function processMeta (data) {
		var obj = {},
		re = /^\/\/\s+@([\w:]+)\s+(.+)/gim;
		while (re.exec(data)) {
			obj[RegExp.$1.toLowerCase()] = RegExp.$2;
		}
		return obj;
	}

	if ("scripts" == info.Path) {
		repo.getTree(info.Branch + "?recursive=true", function (err, tree) {
			var scripts = [];
			for each (var file in tree) {
				if (/^scripts\/(([^_]+)_([\w-]+))\/((\w+)\.user\.js)$/.test(file.path)) {
					scripts.push({
						file	: file,
						branch	: info.Branch,
						group	: RegExp.$2,
						name	: RegExp.$4,
						sname	: RegExp.$5,
						dir		: RegExp.$1,
						sdir	: RegExp.$3,
						fdir	: RegExp.$3.replace(/_+/g, " "),
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
			
			(function recursive (ai) {
				if (ai < scripts.length) {
					repo.getBlob(scripts[ai].file.sha, function (err, data) {
						scripts[ai].meta = processMeta(data);
						recursive(++ai);
					});
				} else {
					issu.list("state=all", function (err, issues) {
						var labels = {};
						for each (var issue in issues) {
							for each (var label in issue.labels) {
								if (!(label.name in labels)) {
									labels[label.name] = {
										open	: 0,
										closed	: 0,
										all		: 0,
										label	: label.name,
										flabel	: encodeURIComponent(label.name),
									};
								}
								++labels[label.name][issue.state];
								++labels[label.name].all;
							}
						}
						for each (var s in scripts) {
							var l = s.meta.name;
							s.issues = labels[l] || {
								open	: 0,
								closed	: 0,
								all		: 0,
								label	: l,
								flabel	: encodeURIComponent(l),
							};
						}
						writeContent(Template.get(GM_getResourceText("templateList"), {
							files	: scripts,
						}));
					});
				}
			}(0));
		});
	} else {
		var files = Array.prototype.slice.apply(document.querySelectorAll("td.content a"));
		for each (var file in files) {
			if (/\.user\.js$/.test(file.textContent)) {
				var id = file.id.split("-");
				info.Sha = id[1];
				info.File = file.textContent.replace(/(?:\.\w{2,4}){1,2}$/, "");

				repo.getBlob(info.Sha, function (err, data) {
					var meta = processMeta(data);

					issu.list("labels=" + meta.name, function (err, issues) {
						writeContent(Template.get(GM_getResourceText("template"), {
							meta	: meta,
							info	: info,
							file	: file,
							issues	: issues.filter(function (a) {
								for each (var label in a.labels) {
									if (meta.name == label.name) {
										return true;
									}
								}
								return false;
							}),
							updated_at	: new Date().toISOString(),
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
				});

				break;
			}
		}
	}
}
