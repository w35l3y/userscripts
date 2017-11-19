// ==UserScript==
// @name           Includes : I18n
// @namespace      http://gm.wesley.eti.br/includes
// @description    I18n Function
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2011+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        3.2.1
// @language       en
// @include        nowhere
// @exclude        *
// @icon           http://gm.wesley.eti.br/icon.php?desc=87940
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_deleteValue
// @grant          GM.deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM.xmlHttpRequest
// @grant          GM_getResourceText
// @grant          GM.getResourceText
// @resource       i18n ../../includes/Includes_I18n/resources/default.json
// @resource       meta https://github.com/w35l3y/userscripts/raw/master/includes/Includes__I18n/87940.user.js
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        ../../includes/Includes_HttpRequest/56489.user.js
// @require        ../../includes/Includes_Translate/85618.user.js
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

var I18n = {
    get locale() {
        return (async function () {
            return await GM.getValue("locale", navigator.language) || "";
        })();
    },
    set locale(value) {
        (async function () {
            await GM.setValue("locale", value);
        })();
    },
    get    : async function (item_str, item, obj, callback) {
        var section = I18n.locale.toLowerCase().replace(/[_-]+/g, "-").split(",").map(function ($0) {
            return (~$0.indexOf("-") ? $0.substring(0, $0.indexOf("-")) : $0);
        }),
        i18n = JSON.parse(await GM.getValue("i18n") || '{"version" : -1, "languages" : {}}'),
        res = {
            "version"    : 0,
            "languages"    : {}
        };
        
        if (!("languages" in i18n)) {
            await GM.deleteValue("i18n");
            i18n = {
                "version" : -1,
                "languages" : {}
            };
        }

        if (typeof item == "function") {
            callback = item;
            item = null;
            obj = null;
        } else if (typeof obj == "function") {
            callback = obj;
            obj = null;
        }

        if (item instanceof Array) {
            obj = item;
            item = null;
        }

        var cb2 = function (str) {
            return (obj ? str.replace(/\{(\d+)\}/g, function ($0, $1) {
                return ($1 in obj ? obj[$1] : $0);
            }) : str);
        },
        cb = function (str) {
            if (callback) {
                callback(str, obj);
            }

            return cb2(str);
        };

        if (!item) {
            item = item_str.toLowerCase().replace(/[^\u0100-\uffff\w?,.-]+/g, "");

            if (item_str.length && !item) {
                item = item_str;
            }
        }

        // For compatibility with v2.0.1.0
        try {
            res = JSON.parse(await GM.getResourceText("i18n").replace(/^\(|\)$/g, "") || "{}");
            
            if (!("languages" in res)) {
                res.version = 0;
                res.languages = res;
            }
        } catch (e) { }

        if (i18n.version < res.version) {
            i18n.version = res.version;
            i18n.languages = {};
            await GM.setValue("i18n", JSON.stringify(i18n));
        }

        if (section.length) {
            for (var lk in section) {
                var lang = section[lk];
                if (lang in res.languages && item in res.languages[lang]) {
                    return cb(res.languages[lang][item]);
                } else if (lang in i18n.languages && item in i18n.languages[lang]) {
                    return cb(i18n.languages[lang][item]);
                }
            }

            var def = res["default"] || "en",
            meta = typeof GM_info != "undefined" && GM_info.scriptMetaStr || "";
            
            try {
                meta = await GM.getResourceText("meta");
            } catch (e) { }

            meta += "\n// @language " + def;
            
            var metaLang = /^\/\/ @language\s+(\w+)/m.test(meta) && RegExp.$1,
            translate = function (text, from, to, item) {
                Translate.execute(text.replace(/\n/g, "<br />"), from, to, async function (result) {
                    if (result.translation) {
                        var data = JSON.parse(await GM.getValue("i18n") || '{"version":0,"languages":{}}');

                        if (!(to in data.languages)) {
                            data.languages[to] = {};
                        }

                        data.languages[to][item] = result.translation.replace(/\s*<br\s*\/?>\s*/g, "\n");
                        
                        await GM.setValue("i18n", JSON.stringify(data));
                        
                        return cb(data.languages[to][item]);
                    }
                });
            };

            for (var key in section) {
                if (def in res.languages && item in res.languages[def] && res.languages[def][item] != null) {
                    translate(res.languages[def][item], def, section[key], item);

                    return cb2(res.languages[def][item]);
                }

                for (var lang in res.languages) {
                    if (lang != def && item in res.languages[lang] && res.languages[lang][item] != null) {
                        translate(res.languages[lang][item], lang, section[key], item);

                        return cb2(res.languages[lang][item]);
                    }
                }

                if (metaLang != section[key]) {
                    translate(item_str, metaLang, section[key], item);

                    return cb2(item_str);
                }
            }
        }

        return cb(item_str);
    }
};

function __ () {
    return I18n.get.apply(I18n, Array.prototype.slice.apply(arguments));
}
