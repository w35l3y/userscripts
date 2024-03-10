// ==UserScript==
// @name        Includes : Neopets : Battledome
// @namespace   https://gm.wesley.eti.br
// @description Battledome Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (https://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    https://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @require     https://github.com/w35l3y/localStorageDB/raw/master/localstoragedb.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_[BETA]/main.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_JellyNeo_Battlepedia/main.user.js
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
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
**************************************************************************/

var Battledome = function (page) {
  if (!page.database.tableExists("equipments")) {
    page.database.createTable("equipments", ["item_ID", "icons", "rating"]);
    page.database.commit();
  }

  var _bd = {
      started: false,
      data: [],
      log: "",
      ajaxData: {
        step: 0,
        intro: 0,
        status: 1,
      },
    },
    _request = function (url, data, cb, delay) {
      page.request({
        method: "POST",
        action: url,
        referer: "https://www.neopets.com/dome/arena.phtml",
        data: data,
        delay: typeof delay == "undefined" ? [5000, 2500] : delay,
        format: "json",
        callback: function (ro) {
          var r = ro.body;
          if (r.success) {
            _bd.ajaxData.battleid = _bd.battleid =
              r.battle.battleid || r.battle.id;
            _bd.ajaxData.status = r.battle.status;
            _bd.data = r.battle;
            if (r.p1) {
              _bd.ajaxData.step = r.p1.fight_step;
            }
            _bd.log = r.log;
          } else if (r.error) {
            ro.error = 1;
            ro.errmsg = r.error;
          }

          cb(ro);
        },
      });
    };

  this.fight = function (data1, cb) {
    var parseItems = function (str) {
        var output = [],
          re = /\/items\/(\w+).+?id="(\d+)".+?title="(.+?)"/gi,
          match;

        while ((match = re.exec(str))) {
          output.push({
            id: match[2],
            name: match[3],
            image: match[1],
          });
        }

        return output;
      },
      parseIcons = function (icons) {
        var output = {},
          str = icons.split(";"),
          k = "ADEFLPW",
          sum = 0;
        for (var ai = 0, at = k.length; ai < at; ++ai) {
          var s = str[ai],
            p = "%".indexOf(s);

          output[k[ai]] = {
            value: s.replace(/\D+/g, "") / (p ? 100 : 1) || 0,
            type: p ? "%" : "N",
          };
          if (!p) {
            ++sum;
          }
        }
        output.total = sum;

        return output;
      },
      serializeIcons = function (icons) {
        var o = "ADEFLPW",
          output = [];

        for (var ai = 0, at = o.length; ai < at; ++ai) {
          var k = o[ai];

          output.push(
            k in icons
              ? icons[k].type == "%"
                ? 100 * icons[k].value + "%"
                : icons[k].value
              : "0"
          );
        }

        return output.join(";");
      },
      parseEquipment = function (equip) {
        var icons = equip.icons.split("|");

        equip.attack = parseIcons(icons[0]);
        equip.defense = parseIcons(icons[1]);

        return equip;
      },
      _this = this,
      ajax = function (data2, callback, delay) {
        var d = JSON.parse(JSON.stringify(_bd.ajaxData));

        if (data2) {
          for (var k in data2) {
            d[k] = data2[k];
          }
        }

        _request(
          "https://www.neopets.com/dome/ajax/arena.php",
          d,
          callback || function () {},
          delay
        );
      },
      strength = [
        [
          0, 8, 13, 20, 35, 55, 85, 125, 200, 250, 300, 350, 400, 450, 500, 550,
          600, 650, 700, 750,
        ],
        [
          0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4.5, 5.5, 6.5, 7.5, 8.5, 9.75, 11,
          12, 13, 14, 15, 16,
        ],
      ],
      abilities = [
        [0, "--", 0, 0], // 0 Nothing
        [0, "L-", 3, 0], // Static Cling
        [0, "W-", 6, 0], // An Icicle
        [2, "-H", 0, 25], // Healing Fire
        ,
        ,
        ,
        ,
        ,
        ,
        [0, "E-", 2, 0], // 10 Halitosis
        [0, "W-", 4, 0], // Drizzle
        [2, "-H", 0, 5], // Bandage
        [0, "-H", 0, 4], // Meditate
        [0, "-H", 0, 3], // Shade
        [1, "P-", 0.05, 0], // 15 Cranky
        [2, "-P", 0, 0.05], // Meh
        [2, "-P", 0, 0.05], // Positive Thinking
        [0, "F-", 4, 0], // Sear
        [0, "D-", 8, 0], // Irritable Minions
        [3, "-P", 0, 1], // 20 Throw Pillows
        [2, "-P", 0, 1], // Lens Flare
        [2, "-P", 0, 1], // Shhhhhhhhh...
        [2, "-P", 0, 0.2], // Shroud
        [2, "-P", 0, 0.21], // Float
        [2, "-P", 0, 0.3], // 25 Burrow
        [3, "AP", 6, 1], // Tempest
        [3, "-P", 0, 1], // Snowager's Breath
        [2, "-P", 0, 1], // Warlock's Rage
        [2, "-P", 0, 0.05], // Rejuvenate
        [2, "-P", 0, 0.1], // 30 Drain Life
        [2, "P-", 2 / 3, 0], // Reflect
        [2, "F-", 6, 0], // Rally Cry
        [2, "P-", 0.08125, 0], // Adrenaline Rush
        [3, "DP", 10, 0.99], // Meepit Stampede
        [3, "FP", 10, 0.99], // 35 Summon Monoceraptor
        ,
        [3, "EP", 10, 0.99], // Esophagor Stench
      ],
      recursive1 = function (plays) {
        _this.startFight(data1, function (oo) {
          if (!oo.body.success) {
            cb(oo);
            return;
          }

          _bd.started = true;
          ajax(
            {
              intro: 1,
            },
            function (ro) {
              if (ro.error) {
                cb(ro);
                return;
              }

              var o = ro.body,
                timer = setInterval(function () {
                  if (_bd.started && 1 == _bd.data.status) {
                    ajax({});
                  } else {
                    clearInterval(timer);
                  }
                }, 15000),
                equipsById = {},
                equipments = parseItems(o.p1.items),
                itemsImage = equipments.map(function (item) {
                  equipsById[item.id] = {
                    equip: item,
                  };

                  return item.image;
                }),
                itemsFound = page.database.queryAll("items", {
                  query: function (row) {
                    return -1 < itemsImage.indexOf(row.image);
                  },
                }),
                equipmentsFound = page.database.queryAll("equipments", {
                  query: function (row) {
                    var found = false;

                    for (var ai = 0, at = itemsFound.length; ai < at; ++ai) {
                      if (
                        !itemsFound[ai].equipment &&
                        itemsFound[ai].ID == row.item_ID
                      ) {
                        itemsFound[ai].equipment = parseEquipment(row);
                        for (
                          var bi = 0, bt = equipments.length;
                          bi < bt;
                          ++bi
                        ) {
                          if (equipments[bi].image == itemsFound[ai].image) {
                            var kk = equipsById[equipments[bi].id];
                            if (kk.item) {
                              break;
                            } else {
                              kk.item = itemsFound[ai];
                            }
                          }
                        }
                        found = true;
                      }
                    }

                    return found;
                  },
                }),
                equipmentsImage = itemsFound
                  .filter(function (item) {
                    return item.equipment;
                  })
                  .map(function (item) {
                    return item.image;
                  }),
                equipmentsNotFound = equipments
                  .filter(function (item) {
                    return !~equipmentsImage.indexOf(item.image);
                  })
                  .map(function (item) {
                    return item.name;
                  }),
                bp = new Battlepedia(),
                recursive2 = function (ro) {
                  var r = ro.body;
                  if (r.error) {
                    clearInterval(timer);
                    cb(ro);
                    return;
                  }
                  if (r.success) {
                    if (1 != r.battle.status) {
                      // finished
                      _bd.ajaxData.step = 0;
                      _bd.started = false;
                      clearInterval(timer);

                      if (0 < --plays) {
                        recursive1(plays);
                      } else {
                        cb(ro);
                      }
                      return;
                    }
                    var bestWeapons = parseItems(r.p1.items)
                        .sort(function (x, y) {
                          var wX = equipsById[x.id],
                            wY = equipsById[y.id];

                          if (wX) {
                            if (wY) {
                              var eX = wX.item.equipment,
                                eY = wY.item.equipment;
                              if (eX.ID != eY.ID) {
                                if (1 > Math.abs(eX.rating - eY.rating)) {
                                  if (
                                    4 >
                                    Math.abs(eX.attack.total - eY.attack.total)
                                  ) {
                                    if (
                                      4 >
                                      Math.abs(
                                        eX.defense.total - eY.defense.total
                                      )
                                    ) {
                                      return eX.rating > eY.rating ? -1 : 1; // DESC
                                    }
                                    return eX.defense.total > eY.defense.total
                                      ? -1
                                      : 1; // DESC
                                  }
                                  return eX.attack.total > eY.attack.total
                                    ? -1
                                    : 1; // DESC
                                }
                                return eX.rating > eY.rating ? -1 : 1; // DESC
                              }
                              return 0;
                            }
                            return -1;
                          } else if (wY) {
                            return 1;
                          }
                          return 0;
                        })
                        .map(function (item) {
                          return parseInt(item.id, 10);
                        }),
                      bestAbility = Object.keys(r.p1.abils)
                        .filter(function (item) {
                          return !r.p1.abils[item].hasCooldown;
                        })
                        .map(parseFloat)
                        .sort(function (x, y) {
                          var a = abilities[x],
                            b = abilities[y];

                          if (a[1][0] == b[1][0]) {
                            if (a[2] == b[2]) {
                              if (a[1][1] == b[1][1]) {
                                if (a[3] == b[3]) {
                                  return 0;
                                }
                                return a[3] > b[3] ? -1 : 1; // DESC
                              }
                            }
                            return a[2] > b[2] ? -1 : 1; // DESC
                          }
                          return x > y ? -1 : 1; // DESC
                        });

                    setTimeout(function () {
                      ajax(
                        {
                          p1s: r.p1.s || "",
                          eq1: bestWeapons[0] || 0, // P1 equip 1
                          eq2: bestWeapons[1] || 0, // P1 equip 2
                          p1a: bestAbility[0] || 0, // P1 ability
                          chat: "",
                          action: "attack",
                          ts: new Date().getTime(),
                        },
                        recursive2,
                        0
                      );
                    }, 4000 + Math.floor(1500 * Math.random()));
                  }
                };

              if (equipmentsNotFound.length) {
                var insertEquipment = function (item_ID, item) {
                  var output = {
                    item_ID: item_ID,
                    icons:
                      serializeIcons(item.attack) +
                      "|" +
                      serializeIcons(item.defense) +
                      "|",
                    rating: item.rating,
                  };
                  output.ID = page.database.insert("equipments", output);

                  item.equipment = output;

                  for (var k in equipsById) {
                    var kk = equipsById[k];
                    if (!kk.item && kk.equip.image == item.image) {
                      kk.item = item;
                    }
                  }
                };

                bp.searchAll({
                  items: equipmentsNotFound,
                  callback: function (res) {
                    for (var ai = 0, at = res.list.length; ai < at; ++ai) {
                      var item = res.list[ai],
                        ids = page.database.insertOrUpdate(
                          "items",
                          {
                            image: item.image,
                          },
                          item
                        );

                      insertEquipment(
                        ids instanceof Array ? ids[0] : ids,
                        item
                      );
                    }

                    page.database.commit();
                    recursive2(ro);
                  },
                });
              } else {
                recursive2(ro);
              }
            }
          );
        });
      };

    recursive1(data1.plays);
  };

  this.startFight = function (data, cb) {
    _request(
      "https://www.neopets.com/dome/ajax/startFight.php",
      {
        type: 2,
        pet: data.petName,
        npcId: data.opponentId,
        toughness: data.toughness,
      },
      cb
    );
  };

  this.userPets = function (data, cb) {
    _request(
      "https://www.neopets.com/dome/ajax/getUserPets.php",
      {
        username: data.username,
      },
      cb
    );
  };
};
