// ==UserScript==
// @name        Includes : Neopets : FEAgency
// @namespace   https://gm.wesley.eti.br
// @description FaerielandEmploymentAgency Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (https://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    https://gm.wesley.eti.br
// @version     1.0.1
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

var FEAgency = function (page) {
  //page.database.truncate("fea");
  if (!page.database.tableExists("fea")) {
    page.database.createTable("fea", [
      "id",
      "item_ID",
      "quantity",
      "time",
      "reward",
      "type",
    ]);
    page.database.commit();
  }

  var _get = function (data, cb) {
      page.request({
        method: "get",
        action: "https://www.neopets.com/faerieland/employ/employment.phtml",
        referer:
          "https://www.neopets.com/faerieland/employ/employment.phtml?type=jobs",
        delay: true,
        data: data,
        callback: function (o) {
          console.log("FEA", o, cb);
          parse(data, cb, o);
        },
      });
    },
    parse = function (data, cb, o) {
      switch (data.type) {
        case "jobs":
          o.isNew = false;
          o.jobs = xpath(
            ".//td[@class = 'content']/center/table/tbody/tr/td/b/a[contains(@href, '&job_id=')]",
            o.body
          ).map(function (item) {
            var row = xpath("./ancestor::tr[1]", item)[0],
              info = xpath(
                "./b[1]/text()|./text()",
                row.nextElementSibling.cells[0]
              ).map(function (value, index) {
                return 1 == index
                  ? value.textContent.trim()
                  : parseInt(value.textContent.replace(/\D+/g, ""), 10);
              }),
              output = {
                id: parseInt(item.href.match(/job_id=(\d+)/)[1], 10),
                type: (/background-color:(#\w+);/.test(
                  row.cells[0].getAttribute("style")
                )
                  ? RegExp.$1
                  : "#000000"
                ).toUpperCase(),
                quantity: info[0],
                item: {
                  name: info[1],
                  image: row.cells[0].firstElementChild
                    .getAttribute("src")
                    .replace(
                      /^http:\/\/images\.neopets\.com\/items\/|\.gif$/g,
                      ""
                    ),
                },
                time: info[2] * 60000, // milliseconds
                reward: info[3],
              },
              oldItem = page.database.queryAll("items", {
                query: {
                  name: output.item.name,
                },
                limit: 1,
              }),
              newItem = oldItem.length ? oldItem[0] : undefined;

            if (newItem) {
              newItem.image = output.item.image;
              output.item_ID = newItem.ID;
              output.item = newItem;
            } else {
              output.item_ID = page.database.insert("items", output.item);
            }

            if (
              !(
                page.database.insertOrUpdate(
                  "fea",
                  {
                    id: output.id,
                  },
                  output
                ) instanceof Array
              )
            ) {
              o.isNew = true;
            }

            return output;
          });
          page.database.commit();
          break;
        case "apply":
          page.database.deleteRows("fea", {
            id: data.job_id,
          });
          page.database.commit();
        case "desc":
          var texts = xpath(
              ".//td[@class = 'content']/center/b/text()|.//td[@class = 'content']/center/b/b/text()",
              o.body
            ),
            finished = !xpath(
              "boolean(.//td[@class = 'content']//a[contains(@href, 'job_quit=')])",
              o.body
            ),
            n = function (v) {
              return parseInt(s(v).replace(/\D+/g, ""), 10);
            },
            s = function (v) {
              return v.textContent.trim() || "";
            },
            t = function (v) {
              var re = /(\d+) (\w)/g,
                m,
                multiplier = { h: 3600, m: 60, s: 1 },
                sum = 0;
              while ((m = re.exec(v.textContent))) {
                sum += m[1] * multiplier[m[2]];
              }
              return 1000 * sum;
            };
          o.found = true;
          if (!o.error && "apply" == data.type && (o.error = finished)) {
            o.errmsg = xpath(
              "normalize-space(.//td[@class = 'content' and not(div)]/text()[normalize-space(.)]|.//td[@class = 'content' and not(div)]/center[2]|.//td[@class = 'content']/div[a[contains(@href, 'type=desc')]])",
              o.body
            );
            o.found = !(
              ~o.errmsg.indexOf("job could not be found") ||
              ~o.errmsg.indexOf("No job with this ID was found")
            );
          }
          try {
            var len = texts.length;
            o.data = {};
            if (5 < len) {
              if (finished) {
                //	errorMessage,id,quantity,item,time,reward
                //	successMessage,elapsedTime,totalReward[,success,previousLevel,currentLevel],title,id,quantity,item,time,reward
                o.message = s(texts[0]);
                var reward = n(texts[len - 1]);
                o.data = {
                  id: n(texts[len - 5]),
                  quantity: n(texts[len - 4]),
                  item: {
                    name: s(texts[len - 3]),
                    image: undefined,
                  },
                  time: t(texts[len - 2]),
                  reward: reward,
                };
                if (6 < len) {
                  if (7 < len) {
                    o.data.elapsedTime = t(texts[1]);
                    o.data.bonusReward = n(texts[2]) - reward;
                  }
                } else {
                  finished = false;
                  o.error = 1;
                  o.errmsg = o.message;
                }
                if (9 < len) {
                  o.data.prevLevel = s(texts[4]);
                  o.data.currLevel = s(texts[5]);
                }
              } else if (!o.error) {
                //	id,quantity,item,time,reward,remaingTime,givenItems,(item),quitPrice
                var time = t(texts[3]);

                o.data = {
                  id: n(texts[0]),
                  quantity: n(texts[1]),
                  item: {
                    name: s(texts[2]),
                    image: undefined,
                  },
                  time: time,
                  reward: n(texts[4]),
                  elapsedTime: time - t(texts[5]),
                };
              }
            }
            o.data.finished = finished;
          } catch (e) {
            console.log(e);
          }
          break;
      }

      cb(o);
    };

  this.jobs = function (obj) {
    var data = obj.data;
    data.type = "jobs";
    _get(data, obj.callback);
  };

  this.allJobs = function (obj) {
    var jobs = [],
      _this = this,
      cb = obj.callback;
    if (!obj.data) {
      obj.data = {};
    }
    _this.jobs({
      data: obj.data,
      callback: function (o) {
        (function recursive(o, start, first) {
          Array.prototype.push.apply(jobs, o.jobs);

          if (0 <= start && (o.isNew || first)) {
            obj.data.start = start;
            _this.jobs({
              data: obj.data,
              callback: function (o) {
                recursive(o, start - 10, false);
              },
            });
          } else {
            if (!o.isNew) {
              jobs = page.database.queryAll("fea");

              var itemtojob = {},
                items_ids = jobs.map(function (o, index) {
                  if (o.item_ID in itemtojob) {
                    itemtojob[o.item_ID].push(index);
                  } else {
                    itemtojob[o.item_ID] = [index];
                  }
                  return o.item_ID;
                });

              page.database
                .queryAll("items", {
                  query: function (o) {
                    return 0 <= items_ids.indexOf(o.ID);
                  },
                })
                .forEach(function (item) {
                  itemtojob[item.ID].forEach(function (job) {
                    jobs[job].item = item;
                  });
                });
            }

            var job_ids = jobs.map(function (job) {
              return job.id;
            });
            page.database.deleteRows("fea", function (row) {
              return !~job_ids.indexOf(row.id);
            });
            page.database.commit();

            o.jobs = jobs
              .filter(function (job) {
                return job.reward >= job.quantity * job.item.price;
              })
              .map(function (v, i) {
                return {
                  profit1: v.reward - v.quantity * v.item.price,
                  profit2:
                    v.reward *
                      Math.max(0, 1.25 - (12000 * v.quantity) / v.time) -
                    v.quantity * v.item.price,
                  quantity: v.quantity,
                  time: v.time,
                  value: v,
                };
              })
              .sort(function (a, b) {
                return (
                  -(a.profit2 > b.profit2) ||
                  +(a.profit2 != b.profit2) || // profit2 DESC
                  -(a.profit1 > b.profit1) ||
                  +(a.profit1 != b.profit1) || // profit1 DESC
                  -(a.quantity < b.quantity) ||
                  +(a.quantity != b.quantity) || // quantity ASC
                  -(a.time > b.time) ||
                  +(a.time != b.time)
                ); // time DESC
              })
              .map(function (v) {
                return v.value;
              });

            cb(o);
          }
        })(
          o,
          /start=(\d+)/.test(
            xpath(
              "string(.//td[@class = 'content']/center/b[position() = last()]/a[contains(@href, 'start')]/@href)",
              o.body
            )
          )
            ? parseInt(RegExp.$1, 10)
            : 0,
          true
        );
      },
    });
  };

  this.apply = function (obj) {
    if (!obj.id) {
      throw "FEA APPLY : 'id' is required";
    }

    console.log(
      "https://www.neopets.com/faerieland/employ/employment.phtml?type=desc&job_id=" +
        obj.id
    );
    _get(
      {
        job_id: obj.id,
        type: "apply",
      },
      obj.callback
    );
  };

  this.desc = function (obj) {
    if (!obj.id) {
      throw "FEA APPLY : 'id' is required";
    }

    _get(
      {
        job_id: obj.id,
        type: "desc",
      },
      obj.callback
    );
  };
};
