// ==UserScript==
// @name        GitHub : Missing Readme
// @namespace   http://gm.wesley.eti.br
// @description Updates the README.md for the folders that contains userscripts (.user.js) in it
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2014+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     2.2.0
// @language    en
// @include     /^https?:\/\/github\.com\/\w+\/\w+\/tree\/\w+\/\w+/
// @icon        http://gm.wesley.eti.br/icon.php?desc=scripts/GitHub_Missing_Readme/main.user.js#
// @resource    template ./README-template.md
// @resource    templateList ./README-templateList.md
// @require     http://pastebin.com/raw.php?i=FY7MDpMa
// @require     https://github.com/w35l3y/github/raw/master/lib/underscore-min.js
// @require     https://github.com/w35l3y/github/raw/master/github.js
// @require     ../../includes/Includes_Notify/292725.user.js
// @require     ../../includes/Includes_Assert/288385.user.js
// @require     ../../includes/Includes_Template_%5BBETA%5D/176400.user.js
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
	
	function writeContent (tree, message) {
		repo.write(info.Branch, tree, message, function (err) {
			alert(err?err:"File(s) updated successfully.");
		});
	}

	function processMeta (data) {
		var obj = {},
		re = /^\/\/\s+@([\w:]+)\s+(.+)/gim,
		list = ["include", "exclude", "grant", "resource", "require", "history"],
		orderByAsc = function (a, b) {
			if (a.key) {
				return (a.key > b.key?1:-1);
			} else if (a.length == b.length) {
				return (a > b?1:-1);
			} else {
				return (a.length > b.length?1:-1);
			}
		};

		while (re.exec(data)) {
			var key = RegExp.$1.toLowerCase(),
			value = RegExp.$2;
			if (key in obj || ~list.indexOf(key)) {
				if (!(key in obj)) {
					obj[key] = [];
				} else if (!(obj[key] instanceof Array)) {
					obj[key] = [/^([^\s]+)\s+(.+)/.test(obj[key])?{
						key	: RegExp.$1,
						value	: RegExp.$2,
					}:obj[key]];
				}
				obj[key].push(/^([^\s]+)\s+(.+)/.test(value)?{
					key	: RegExp.$1,
					value	: RegExp.$2,
				}:value);
			} else {
				obj[key] = value;
			}
		}

		for each (var key in list.slice(0, 4)) {
			if (key in obj) {
				obj[key].sort(orderByAsc);
			}
		}

		return obj;
	}

	if (!~info.Path.indexOf("/")) {
		repo.getTree(info.Branch + "?recursive=true", function (err, tree) {
			var scripts = [],
			path = {
				name	: info.Path,
				fname	: info.Path.charAt(0).toUpperCase() + info.Path.substr(1).toLowerCase(),
				updated_at	: new Date().toISOString(),
			},
			trees = {},
			blobs = tree.filter(function (a) {
				return ("blob" == a.type);
			});
			for each (var dir in tree.filter(function (a) {
				return ("tree" == a.type);
			})) {
				trees[dir.path] = dir;
			}
			for each (var file in blobs) {
				if (!file.path.indexOf(info.Path)) {
					if (/^(\w+\/([^\/]+))\/((\w+)\.user\.js)$/.test(file.path)) {
						var root = RegExp.$1;
						scripts.push({
							file	: file,
							tree	: trees[root],
							info	: info,
							branch	: info.Branch,
							issues	: {
								meta : {
									open	: 0,
									closed	: 0,
									all		: 0,
								},
								list	: [],
							},
							updated_at	: new Date().toISOString(),
							raw		: "../../../raw/" + info.Branch + "/" + file.path,
							name	: RegExp.$3,
							sname	: RegExp.$4,
							dir		: RegExp.$2,
							group	: [],
							meta	: {},
							sshots	: blobs.filter(function (a) {
								return (!a.path.indexOf(root + "/") && !~a.path.indexOf("/", 1 + root.length) && /\.(?:jpg|png|gif)$/i.test(a.path));
							}).map(function (a) {
								var n = a.path.replace(root + "/", "");
								return {
									name	: n,
									fname	: n.replace(/\.\w+$/, ""),
								};
							}),
						});
					} else if (/^\w+\/README-templateList\.md$/.test(file.path)) {
						path.templateList = file;
					} else if (/^\w+\/README-template\.md$/.test(file.path)) {
						path.template = file;
					}
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
						scripts[ai].group = scripts[ai].meta.name.split(" : ").slice(0, -1).filter(function (a) {
							return (a != path.fname);
						});
						recursive(++ai);
					});
				} else {
					issu.list({state:"all"}, function (err, issues) {
						var labels = {};
						for each (var issue in issues) {
							for each (var label in issue.labels) {
								if (!(label.name in labels)) {
									labels[label.name] = {
										meta : {
											open	: 0,
											closed	: 0,
											all		: 0,
											label	: label.name,
											flabel	: encodeURIComponent(label.name),
										},
										list	: [],
									};
								}
								++labels[label.name].meta[issue.state];
								++labels[label.name].meta.all;
							}
							if (label) {
								labels[label.name].list.push(issue);
							}
						}
						for each (var s in scripts) {
							s.issues.meta.label = s.meta.name;
							s.issues.meta.flabel = encodeURIComponent(s.issues.label);
							s.issues.list = issues.filter(function (a) {
								var output = (-1 < a.body.indexOf(s.meta.name));
								if (!output && a.labels.length) {
									for each (var label in a.labels) {
										if (s.meta.name == label.name) {
											output = true;
											break;
										}
									}
								}
								if (output) {
									++s.issues.meta[a.state];
									++s.issues.meta.all;
								}

								return output;
							});
						}

						path.files = scripts;
						
						function getTemplate (name, cb) {
							if (path[name]) {
								repo.getBlob(path[name].sha, cb);
							} else {
								cb(null, GM_getResourceText(name));
							}
						}

						getTemplate("templateList", function (err, data) {
							var trees = [{
								path	: decodeURIComponent(info.Path) + "/README.md",
								mode	: "100644",
								type	: "blob",
								content	: Template.get(data, path),
							}];
							
							if (path.files.length) {
								getTemplate("template", function (err, data) {
									for each (var script in path.files) {
										trees.push({
											path	: decodeURIComponent(script.tree.path) + "/README.md",
											mode	: "100644",
											type	: "blob",
											content	: Template.get(data, script),
										});
									}

									writeContent(trees, "Updated all README.md recursively.");
								});
							} else {
								writeContent(trees, "Updated " + trees[0].path);
							}
						});
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

					issu.list({state:"all"}, function (err, issues) {
						var path = decodeURIComponent(info.Path) + "/README.md";

						writeContent([{
							path	: path,
							mode	: "100644",
							type	: "blob",
							content	: Template.get(GM_getResourceText("template"), {
								meta	: meta,
								info	: info,
								file	: {
									path	: file.textContent,
								},
								issues	: {
									list : issues.filter(function (a) {
										var output = (-1 < a.body.indexOf(meta.name));
										if (!output) {
											for each (var label in a.labels) {
												if (meta.name == label.name) {
													output = true;
													break;
												}
											}
										}
										return output;
									}),
								},
								updated_at	: new Date().toISOString(),
								raw		: "../../../raw/" + info.Branch + "/" + info.Path + "/" + file.textContent,
								sshots	: files.filter(function (a) {
									return /\.(?:jpg|png|gif)$/i.test(a.href);
								}).map(function (a) {
									return {
										name	: a.textContent,
										fname	: a.textContent.replace(/\.\w+$/, ""),
									};
								}),
							}),
						}], "Updated " + path);
					});
				});

				break;
			}
		}
	}
}
