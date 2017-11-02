// ==UserScript==
// @name           Interno : Registros Reservados
// @namespace      br.eti.wesley
// @description    Alerta sobre alguns registros reservados para testes automatizados
// @include        nowhere
// @exclude        *
// @version        1.2.2
// @language       pt-br
// @grant          GM_log
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @icon           http://gm.wesley.eti.br/icon.php?desc=180525
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/backup/wontfix/page1/180525.user.js
// @resource       i18n https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/resources/default.json
// @resource       winConfigCss https://github.com/w35l3y/userscripts/raw/master/includes/Includes_WinConfig/resources/default.css
// @resource       updaterWindowHtml https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/resources/default.html
// @resource       updaterWindowCss https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/resources/default.css
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Translate/85618.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_I18n/87940.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Updater/87942.user.js
// @require        https://github.com/w35l3y/userscripts/raw/master/includes/Includes_WinConfig/163374.user.js
// ==/UserScript==

(function () {	// script scope
	var h = xpath(".//thead/tr/th[@class = 'cabecalhoPrincipal' and contains(text(), 'NIT')]")[0];
	if (h) {
		var keyChanged = false,
		win = new WinConfig({
			title: "Registros Reservados : Configurações",
			type: WinConfig.WindowType.CUSTOM,
			size: ["350px", 0],
			load: function (cfg) {
				if (/key=(\w+)/.test(cfg.group.sheet.key)) {
					cfg.group.sheet.key = RegExp.$1;

					keyChanged = true;
				}

				if (keyChanged) {
					keyChanged = false;

					forceReset(cfg.group, function (v) {
						alert(v.length + " registros encontrados com sucesso!");
					});
				}
			},
			fields	: [{
				name: "settingsHotKey",
				label: "Configurações",
				key: "hotkey",
				callback: function (event, win) {
					win.open();
				},
			}, {
				name: "resetHotKey",
				label: "Atualiza cache",
				key: "hotkey",
				default: {
					keyCode	:	65,
				},
				callback: function (event, win) {
					if (confirm("Tem certeza que deseja resetar o cache?")) {
						forceReset(win.get("group"), function (v) {
							alert(v.length + " registros encontrados com sucesso!");
						});
					}
				},
			}, {
				name: "group",
				nogroup: true,
				type: WinConfig.FieldType.GROUP,
				fields: [{
					name: "sheet",
					label: "Planilha",
					type: WinConfig.FieldType.GROUP,
					fields: [{
						name: "key",
						label: "Chave",
						format: WinConfig.FieldFormat.STRING,
						description: "Link ou chave da planilha no Google Spreadsheet contendo a lista de registros reservados para os testes automatizados.<br /><br />Exemplo: https://docs.google.com/spreadsheet/ccc?key=<b>0ArJZsw7BPFJNdEVYbTFqY2dhc0Z4NkNWLXUyalBTbnc</b>",
						events: {
							change: function () {
								keyChanged = true;
							}
						},
						empty: "",
						help: true,
					}, {
						name: "cache",
						label: "Atualiza em",
						format: WinConfig.FieldFormat.NUMBER,
						type: WinConfig.FieldType.SELECT,
						description: "Intervalo de checagem da atualização da planilha",
						empty: "86400000",
						value:[
							{value:1800000,label:"30 minutos"},
							{value:14400000,label:"4 horas"},
							{value:43200000,label:"12 horas"},
							{value:86400000,label:"1 dia"},
							{value:172800000,label:"2 dias"},
							{value:604800000,label:"1 semana"},
							{value:0,label:"Nunca"},
						],
						help: true,
					}],
				}],
			}]
		}),
		opts = win.get("group"),
		cachedNits = JSON.parse(GM_getValue("registros", '["2013-10-23T14:12:55.770Z", []]'));

		function processaListaNits(lista) {
			xpath(".//tr/td[" + (1 + h.cellIndex) + "]/text()", h.parentNode.parentNode.parentNode).forEach(function (row) {
				if (~lista.indexOf(parseInt(row.textContent.replace(/\D/g, ""), 10))) {
					row.parentNode.parentNode.style.backgroundColor = "#FFCCCC";
				}
			});
		}

		function forceReset (opts, cb) {
			GM_xmlhttpRequest({
				method	: "get",
				url			: "https://spreadsheets.google.com/tq?tqx=responseHandler:myHandlerFunction&tq=select+A&key=" + opts.sheet.key,
				onload	: function (xhr) {
					var myHandlerFunction = function (data) {
						if ("ok" == data.status) {
							var nits = [];
							data.table.rows.forEach(function (row) {
								nits.push(row.c[0].v);
							});

							if (nits.length) {
								GM_setValue("registros", JSON.stringify([new Date(), nits]));
								processaListaNits(nits);
							}

							if (cb) {
								cb(nits);
							}
						} else {
							alert(data.errors[0].detailed_message);
						}
					};

					eval(xhr.responseText);
				}
			});
		}

		if (!opts.sheet.cache || (cachedNits[1].length && opts.sheet.cache > new Date() - new Date(cachedNits[0]))) {
			processaListaNits(cachedNits[1]);
		} else if (opts.sheet.key) {
			forceReset(opts);
		}
	}
}());
