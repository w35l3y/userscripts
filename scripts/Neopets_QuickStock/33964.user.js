// ==UserScript==
// @name           Neopets : QuickStock
// @namespace      http://gm.wesley.eti.br
// @description    Allows to execute custom actions to as many items as desired
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2016+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0
// @language       en
// @include        http://www.neopets.com/quickstock.phtml
// @include        http://www.neopets.com/quickstock.phtml?r=*
// @icon           http://gm.wesley.eti.br/icon.php?desc=33964
// @grant          GM_log
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @resource       meta 33964.user.js
// @resource       winConfigCss ../../includes/Includes_WinConfig/resources/default.css
// @require        https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require        ../../includes/Includes_XPath/63808.user.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_WinConfig/163374.user.js
// @require        ../../includes/Includes_Neopets_[BETA]/main.user.js
// @require        ../../includes/Includes_Neopets_QuickStock/main.user.js
// @require        ../../includes/Includes_Neopets_Inventory/main.user.js
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

/*
	Stock		0x000001
	Deposit		0x000002
	Donate		0x000004
	Discard		0x000008	(disabled by default)
	Gallery		0x000010
	Closet		0x000020	(disabled by default)
	Shed		0x000040	(disabled by default)

	Feed		0x001000
	Read		0x002000
	Play		0x004000	(disabled by default)
	Equip		0x008000	(disabled by default)
	Give		0x010000	(disabled by default)
	Neodeck		0x020000	(disabled by default)
	Bless		0x040000	(disabled by default)
	Album		0x080000	(disabled by default)
	
	Normal		0x000FFF
	Show all	0xFFFFFF
*/

(function () {	// script scope
	var normal = xpath(".//td[@class = 'content']//form//tr[1]/th[position() > 1]/b/text()").map(function (node, index) {
		return [Math.pow(2, index), node.nodeValue, -1];
	});

	if (normal.length > 12) {
		alert("[Neopets : QuickStock]\n\nWoah! There are too many options.");
	} else if (normal.length) {
		var others = [
			[0x001000, "Feed", 1, "Feed to"],
			[0x002000, "Read", 1, "Read to"],
			[0x004000, "Play", 1, "Play with"],
			[0x008000, "Equip", 1, "Equip"],
			[0x010000, "Give", 2, "Give to"],
			[0x020000, "Neodeck", 0, "neodeck"],
			[0x040000, "Bless", 1, "Bless"],
			[0x080000, "Album", 0, "stamp"],
		],
		win = new WinConfig({
			title		: "Quickstock : Settings",
			store		: true,
			size		: ["350px", 0],
			load		: function () {
				location.assign("http://www.neopets.com/quickstock.phtml");
			},
			fields		: [{
				name		: "settingsHotKey",
				label		: "Settings HotKey",
				key			: "hotkey",
				callback	: function (event, win) {
					win.open();
				},
			}, {
				label		: "Columns",
				type		: WinConfig.FieldType.CHECK,
				format		: WinConfig.FieldFormat.NUMBER,
				multiple	: true,
				unique		: true,
				name		: "activate",
				empty		: 0x000000,
				default		: 0x003017,
				value		: normal.concat(others).concat([
					[0x000FFF, "Normal"],
					[0xFFFFFF, "Show all"],
				]).map(function (value) {
					return {
						value	: value[0],
						label	: value[1],
					};
				}),
			}],
		}),
		visible = win.get("activate", 0x000FFF),
		custom = others.filter(function (c) {
			return (visible & c[0]);
		}),
		colspan = 1 + normal.length + custom.length,
		addEvent = function (elem) {
			if ("checkall" == elem.name) {
				elem.removeAttribute("onclick");
				elem.addEventListener("click", checkAll, false);
			} else {
				elem.removeAttribute("ondblclick");
				elem.addEventListener("dblclick", uncheckAll, false);
			}
		},
		checkAll = function (e) {
			e.target.checked = true;
			//location.assign("javascript:void(check_all(" + e.target.parentNode.cellIndex + "));");
			unsafeWindow.check_all(e.target.parentNode.cellIndex);
		},
		uncheckAll = function (e) {
			e.target.checked = false;
			xpath(".//td[position() = " + (1 + e.target.parentNode.cellIndex) + "]/input[@name = 'checkall']")[0].checked = false;
		},
		removedCells = -1,
		wait = false,
		form = xpath(".//form[@name = 'quickstock']")[0],
		rows = xpath(".//td[@class = 'content']//form/table/tbody/tr");

		rows.forEach(function (row, indexRow) {
			if (row.cells.length > 5) {
				custom.forEach(function (action) {
					var cell = row.appendChild(row.cells[1].cloneNode(true)),
					elem = cell.firstElementChild;

					if (elem instanceof HTMLInputElement) {
						addEvent(elem);

						if ("checkall" != elem.name) {
							elem.value = action[1].toLowerCase();
						}
					} else if (elem) {
						elem.textContent = action[1];
					}
				});
				
				var removed = -1;
				Array.prototype.slice.apply(row.cells, [1, 1 + normal.length]).forEach(function (cell, indexCell) {
					if (visible & Math.pow(2, indexCell)) {
						var elem = cell.firstElementChild;

						if (elem instanceof HTMLInputElement) {
							addEvent(elem);
						}
					} else {
						row.deleteCell(cell.cellIndex);
						++removed;
					}
				});
				removedCells = removed;
			} else {
				var cell = row.cells[row.cells.length - 1];
				cell.setAttribute("colspan", colspan - row.cells.length - removedCells);
			}
		});

		form && form.addEventListener("submit", function (e) {
			if (wait) {
				e.preventDefault();
				alert("Please, be patient!");
			} else {
				wait = true;

				var n = new Neopets(document),
				qs = new QuickStock(n),
				items = qs.parse().items.filter(function (item) {
					return item.obj_id && item.action;
				});
				// Prevent from losing items
				xpath(".//input[@type = 'radio' and contains(@name, 'radio_arr')]").forEach(function (node) {
					if (custom.some(function (v) {
						return v[1].toLowerCase() == node.value;
					})) {
						node.checked = false;
					}
				});

				if (70 < items.length || items.some(function (item) {
					return !item.is_normal;
				})) {
					e.preventDefault();

					var inv = new Inventory(n),
					name = [];
					custom.forEach(function (action) {
						qs.add(action[1].toLowerCase(), function (item, cb) {
							var nmkey = action[2] - 1;

							if (~nmkey && undefined === name[nmkey]) {
								name[nmkey] = prompt.apply(null, (nmkey ? ["Username:", ""] : ["Petname:", n.activePet.name || ""])) || "";
							}

							if (!~nmkey || name[nmkey]) {
								var x = {
									data	: {
										obj_id	: item.obj_id,
										action	: action[3] + (~nmkey?" " + name[nmkey]:""),
									},
									callback: cb
								};

								inv.use(x);
							} else {
								cb({error:true, message: "Required field missing: " + action[1]});
							}
						});
					});

					qs.process({
						items	: items,
						callback: function (xhr) {
							location.replace("http://www.neopets.com/quickstock.phtml");
						}
					});
				}
			}
		}, false);

		// overwrites check_all function
		unsafeWindow.check_all = function (col) {
			for each (var elem in xpath(".//form[@name = 'quickstock']//tr[position() != last() - 1]/td/input[@type = 'radio']")) {
				elem.checked = (elem.parentNode.cellIndex == col);
			}
		};
	}
}());
