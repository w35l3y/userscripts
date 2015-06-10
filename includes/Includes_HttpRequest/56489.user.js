// ==UserScript==
// @name           Includes : HttpRequest
// @namespace      http://gm.wesley.eti.br/includes
// @description    HttpRequest Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br/includes
// @version        2.2.0
// @language       en
// @include        nowhere
// @exclude        *
// @grant          GM_xmlhttpRequest
// @contributor    sizzlemctwizzle (http://userscripts.org/guides/9)
// @contributor    Seniltai (http://userscripts.org/topics/47687?page=2#posts-257677)
// @contributor    ameboide (http://userscripts.org/topics/88021#posts-384155)
// ==/UserScript==

/**************************************************************************

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

**************************************************************************/

HttpRequest = function () {};
HttpRequest.open = function (params) {
	return new (function (params) {
		if (!/^https?:\/\//.test(params.url)) {
			params.url = "http://" + params.url;
		}

		this.options = {
			"method"		: (params.method || "GET").toUpperCase(),
			"url"			: params.url || "",
			"headers"		: { "User-Agent" : window.navigator.userAgent },
			"synchronous"	: !!params.synchronous,
			"onload"		: function (e) {
				var obj = params.parameters || {},
				_resp = {};

				Object.defineProperties(_resp, {
					raw : {
						get	: function () {
							return e;
						}
					},
					text: {
						get	: function () {
							return e.responseText;
						}
					},
					xml	: {
						get	: function () {
							if (e.responseXML) {
								return e.responseXML;
							} else {
								if (/^Content-Type: text\/xml/m.test(e.responseHeaders)) {
									return new DOMParser().parseFromString(e.responseText, "text/xml");
								} else if (/^Content-Type: text\/html/m.test(e.responseHeaders)) {
									/*var dt = document.implementation.createDocumentType("html", "-//W3C//DTD HTML 4.01 Transitional//EN", "http://www.w3.org/TR/html4/loose.dtd");
									var doc = document.implementation.createDocument(null, null, dt);

									// I have to find a workaround because this technique make the html(*)/head/body tags disappear.  
									var html = document.createElement("html");
									html.innerHTML = e.responseText;
									doc.appendChild(html);*/
									var doc = document.implementation.createHTMLDocument("");
									doc.documentElement.innerHTML = e.responseText;

									return doc;
								}
							}
						}
					},
					json: {
						get	: function () {
							try {
								return JSON.parse(e.responseText);
							} catch (e) {
								console.log(e);
								try {
									return eval("(" + e.responseText + ")");
								} catch (e) {
									console.log(e);
									return {};
								}
							}
						}
					}
				});
				Object.defineProperty(obj, "response", {
					value	: _resp
				});

				if (typeof params.onsuccess == "function") {
					params.onsuccess(obj);
				}
			}
		};
		
		if ("headers" in params) {
			for (var header in params.headers) {
				this.options.headers[header] = params.headers[header];
			}
		}

		this.send = function (content) {
			if (content) {
				if (content instanceof unsafeWindow.HTMLCollection || content instanceof HTMLCollection) {
					content = Array.prototype.slice.apply(content);
				}
				
				var data = {};
				if (content instanceof Array) {
					for (var ek in content) {
						var e = content[ek];
						if (!/^(?:radio|checkbox)$/i.test(e.type) || e.checked) {
							if (e.checked && /^checkbox$/i.test(e.type)) {
								if (e.name in data) {
									data[e.name].push(e.value);
								} else {
									data[e.name] = [e.value];
								}
							} else {
								data[e.name] = e.value;
							}
						}
					}

					content = data;
				}

				if (typeof content == "object") {
					var x = "";
					for (var key in content) {
						if (content[key] instanceof Array) {
							var keyarr = key.trim();
							if (!/\[\w*\]$/.test(key)) {
								keyarr += "[]";
							}

							for each (var v in content[key]) {
								x += "&" + encodeURIComponent(keyarr) + "=" + encodeURIComponent(v);
							}
						} else {
							x += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(content[key]);
						}
					}

					content = x.substr(1);

					if ("POST" == this.options.method) {
						this.options.headers["Content-Type"] = "application/x-www-form-urlencoded";
						this.options.data = content;
					} else {
						this.options.url += (~this.options.url.indexOf("?") ? "&" : "?") + content;
					}
				} else {
					this.options.data = content;
				}
			}

			this.result = GM_xmlhttpRequest(this.options);

			return this;
		}
	})(params);
};
