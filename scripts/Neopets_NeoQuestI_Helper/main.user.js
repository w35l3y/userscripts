// ==UserScript==
// @name        Neopets : NeoQuest I : Helper
// @namespace   http://gm.wesley.eti.br
// @description Adds shortkeys to NQI
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br/includes
// @version     1.0.1
// @language    en
// @include     http://www.neopets.com/games/neoquest/neoquest.phtml*
// @grant       GM_log
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @icon        http://gm.wesley.eti.br/icon.php?desc=scripts/Neopets_NeoQuestI_Helper/main.user.js
// @resource    winConfigCss http://pastebin.com/raw.php?i=Ldk4J4bi
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_WinConfig/163374.user.js
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

GM_addStyle(".winConfig_NeoQuestHelperSettings .fieldClass_hotkey {float:left;margin-right:2px;width:33%}");

function ViewMonitor (obj) {
	var _this = this,
	executa = function (o) {
		var v = _this.view();
		if (!_this.loading) {
			var block = document.createElement("div");
			block.setAttribute("style", "background-color:#000;position:absolute;width:" + v.clientWidth + "px;height:" + v.clientHeight + "px;opacity:0.3");
			v.insertBefore(block, v.firstChild);
			_this.loading = true;
		}

		HttpRequest.open({
			method		: o.method,
			url			: o.url,
			onsuccess	: function (xhr) {
				var view2 = xpath(obj.view, xhr.response.xml)[0];
				if (view2) {
					v.parentNode.replaceChild(view2, v);
					_this.refresh();
				} else {
					throw xhr.response.raw.finalUrl + " doesn't contain expected view";
				}
			}
		}).send(o.data);
	};

	this.refresh = function () {
		_this.loading = false;
		var view = _this.view();

		xpath(obj.targets, view).forEach(function (target) {
			var isForm = (target instanceof HTMLFormElement),
			p = target.parentNode;
			if (isForm && !target.elements.length && !(p instanceof HTMLTableSectionElement)) { // workaround due to some malformed forms
				p.removeChild(target);
				target.appendChild(p.cloneNode(true));
				p.parentNode.replaceChild(target, p);
			}
			target.addEventListener(isForm?"submit":"click", function (e) {
				e.preventDefault();

				_this.execute(isForm, e.currentTarget);
			}, false);

			obj.update && obj.update(target);
		});
	};
	
	this.execute = function (isForm, element) {
		executa(isForm?{
			method	: element.method || "get",
			url		: element.action || "",
			data	: element.elements,// && (0 === element.elements.length?xpath(".//input|.//textarea", xpath("ancestor::*[form]", element)[0]):element.elements) || undefined,
		}:{
			method	: "get",
			url		: element.href,
		});
	};
	
	this.view = function () {
		return xpath(obj.view)[0];
	};
	
	this.refresh();
}

var area = new ViewMonitor({
	view	: ".//td[@class = 'content']/div[div[@class = 'frame']]",
	targets	: ".//a[contains(@href, 'neoquest.phtml') and not(contains(@href, '../'))]|.//area[contains(@href, 'neoquest.phtml')]|.//form[contains(@action, 'neoquest.phtml')]",
}),
findActions = function (act, node) {
	return xpath(".//a[contains(@onclick, 'setdata(') and contains(@onclick, '" + act + "')]", node).filter(function (val) {
		return (/', \d/.test(val.getAttribute("onclick")));
	}).map(function (val) {
		return (/', (\d+)/.test(val.getAttribute("onclick"))) && [true, {
			method	: "post",
			action	: "http://www.neopets.com/games/neoquest/neoquest.phtml",
			elements: {
				fact	: act,
				type	: RegExp.$1,
			},
			data	: {
				text	: val.textContent,
			},
		}];
	});
},
groups = [{
	name	: "direction",
	label	: "Directions/Fight",
	callback: function (node, key, index) {
		if (4 === index) {
			return xpath(".//table/tbody/tr/td[3]/table/tbody/tr[2]/td/a|.//form[@method = 'post' and contains(@action, 'neoquest.phtml')]/input[@type = 'submit']", node)[0];
		} else {
			return xpath(".//area[contains(@href, '?action=move&movedir=" + [1, 2, 3, 4, null, 5, 6, 7, 8][index] + "')]", node)[0];
		}
	},
	keys	: [
		[0x0, 103, "northWest", "Northwest"],
		[0x0, 104, "north", "North"],
		[0x0, 105, "northEast", "Northeast"],
		[0x0, 100, "west", "West/Heal", function (node) {
			var current = xpath("./div/div[2]/b[3]", node)[0],
			total = xpath("substring(string(./following-sibling::text()[1]), 2)", current),
			diff = total - current.textContent.trim();

			var item = diff && findActions("item", node).filter(function(val) {
				return !!val[1].data.text.indexOf("(heals ");
			}).map(function (val) {
				val[1].data.heals = /\(heals (\d+)\)/.test(val[1].data.text) && parseInt(RegExp.$1, 10);
				val[1].data.qnty = /\((\d+) left\)/.test(val[1].data.text) && parseInt(RegExp.$1, 10);

				return val;
			}).sort(function (a, b) {
				var hA1 = a[1].data.heals,
				hB1 = b[1].data.heals,
				hA2 = Math.abs((diff - hA1) * (diff < hA1?2:1)),
				hB2 = Math.abs((diff - hB1) * (diff < hB1?2:1));

				if (hA2 == hB2) {
					var qA = a[1].data.qnty,
					qB = b[1].data.qnty;

					if (qA == qB) {
						return (hA1 > hB1?1:-1);	// lesser healing
					}
					return (qA > qB?-1:1);	// greater qnty
				}
				return (hA2 > hB2?1:-1);	// lesser diff
				// 20 / 60 (diff = 40)
				// 10	(40 - 10 = 30*1)
				// 30	(40 - 30 = 10*1)
				// 50	(40 - 50 = -10*2)
				// 45	(40 - 45 = -5*2)
			})[0];

			return item && confirm(item[1].data.text + " ?") && item;
		}],
		[0x0, 101, "generic", "Attack/Talk/Return", function (node) {
			return findActions("attack", node)[0] || [false, {
				href	: "http://www.neopets.com/games/neoquest/neoquest.phtml",
			}];
		}],
		[0x0, 102, "east", "East/Flee", function (node) {
			return findActions("flee", node)[0];
		}],
		[0x0, 97, "southWest", "Southwest"],
		[0x0, 98, "south", "South"],
		[0x0, 99, "southEast", "Southeast/Do nothing", function (node) {
			return findActions("noop", node)[0];
		}],
	],
}, {
	name	: "moviment",
	label	: "Moviment Type",
	callback: function (node, key, index) {
		return xpath(".//a[contains(@href, '?movetype=" + (1 + index) + "')]", node)[0];
	},
	keys	: [
		[0x1, 103, "normal", "Normal"],
		[0x1, 104, "hunting", "Hunting"],
		[0x1, 105, "sneaking", "Sneaking"],
	],
}, {
	name	: "others",
	label	: "Others",
	callback: function (node, key, index) {
		return xpath(".//a[contains(@href, '?action=" + key[2] + "')]", node)[0];
	},
	keys	: [
		[0x1, 97, "options", "Options"],
		[0x1, 98, "skill", "View Skills"],
		[0x1, 99, "items", "View Items"],
	],
}];

//GM_deleteValue("config-NeoQuestHelperSettings");
WinConfig.init({
	title	: "NeoQuest Helper : Settings",
	type	: WinConfig.WindowType.CUSTOM,
	size	: ["790px", 0],
	fields	: [{
		name		: "settingsHotKey",
		label		: "Settings HotKey",
		key			: "hotkey",
		callback	: function (event, win) {
			win.open();
		},
	}].concat(groups.map(function (group) {
		return {
			name	: group.name,
			label	: group.label,
			type	: WinConfig.FieldType.GROUP,
			fields	: group.keys.map(function (key, index) {
				return {
					default		: {
						keys	: key[0],
						keyCode	: key[1],
					},
					name		: key[2] + "HotKey",
					label		: key[3],
					key			: "hotkey",
					callback	: function (event, win) {
						if (area.loading) {
							alert("It's loading... Be patient!");
						} else {
							var node = area.view(),
							k = group.callback(node, key, index);

							if (k) {
								k.click();
							} else {
								var x = key[4] && key[4](node);
								if (x) {
									area.execute.apply(area, x);
								} else {
									alert("'" + group.label + " = " + key[3] + "' currently isn't available.");
								}
							}
						}
					},
				};
			}),
		};
	})),
});
