// ==UserScript==
// @name        Includes : Cron [BETA]
// @namespace   http://gm.wesley.eti.br
// @description Cron Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.2.1
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @icon        http://gm.wesley.eti.br/icon.php?desc=includes/Includes_Cron_[BETA]/main.user.js
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

// http://infocenter.sybase.com/help/index.jsp?topic=/com.sybase.infocenter.dc01963.0510/doc/html/psh1360346725201.html
var Cron = function (id, current) {
	var diff = (current?current.valueOf() - Date.now():0),
	isDebug = false,
	_debug = function () {
		isDebug && console.debug.apply(console, arguments);
	},
	_currentDate = function () {
		var v = new Date();
		diff && v.setUTCMilliseconds(v.getUTCMilliseconds() + diff);
		return v;
	},
	createdAt = _currentDate(),
	nextAtKey = id + "-nextAt",
	nextAt = JSON.parse(GM_getValue(nextAtKey, "{}")),
	timer,
	_type = {
		SECOND	: 0,
		MINUTE	: 1,
		HOUR	: 2,
		DAY		: 3,
		MONTH	: 4,
		WEEKDAY	: 5,
		YEAR	: 6,

		NONE	: 0,

		ASTERISK: 1,
		QUESTION: 2,

		HASH	: 1,
		SLASH	: 2,
	},
	intervals = [
		[0, 59],	// second
		[0, 59],	// minute
		[0, 23],	// hour
		[1, 31],	// day
		[1, 12],	// month
		[0, 6],		// weekday
		[0, 0],		// year
	],
	methods = [
		[60, "UTCSeconds"],
		[60, "UTCMinutes"],
		[24, "UTCHours"],
		[31, "UTCDate"],	// under test
		[12, "UTCMonth"],	// under test
		[7, "UTCDay"],		// under test
		[0, "UTCFullYear"],	// under test
	],
	Task = function (obj) {
		var _current = _currentDate(),
		map = {
					// s m h D M d Y
			reboot	: "? ? ? ? ? * ?",
			yearly	: "0 0 0 1 1 * *",
			monthly	: "0 0 0 1 * * *",
			weekly	: "0 0 0 * * 0 *",
			daily	: "0 0 0 * * * *",
			midnight: "0 0 0 * * * *",
			hourly	: "0 0 * * * * *",
		},
		_listeners = [];

		Object.defineProperties(this, {
			id	: {
				enumerable	: true,
				value	: obj.id,
			},
			interval	: {
				enumerable	: true,
				value	: ((obj.interval || "*").replace(/^@(\w+)$/, function ($0, $1) {
					return ($1 in map?map[$1]:$0);
				}) + " * * * * * *").trim().split(/\s+/g).slice(0, 7).map(function (data, index, array) {
					if (/^([\*\?]|\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)(?:([\#\/])(\d+))?$/.test(data)) {
						var type = 1 + "#/".indexOf(RegExp.$2 || undefined);

						var step = parseInt(RegExp.$3, 10) || 1,
						currentValue = _current["get" + methods[index][1]](),
						pInterval = intervals[index];

						return {
							step	: step,
							type	: type,
							wildcard: 1 + "*?".indexOf(RegExp.$1 || undefined),
							values	: RegExp.$1.replace("?", function () {
								return currentValue + (currentValue % step);
							}).replace("*", pInterval.join("-")).replace(/(\d+)-(\d+)/g, function ($0, $1, $2) {
								var opts = [parseInt($1, 10) + (obj.relative?currentValue % step:0)];
								for (var ai = opts[0] + step, at = parseInt($2, 10);ai <= at;ai += step) {
									opts.push(ai);
								}
								return opts.join(",");
							}).split(",").map(function (data) {
								return parseInt(data, 10) - (_type.MONTH == index);	// parse numbers
							}).sort(function (a, b) {
								return (a > b?1:-1);	// asc
							}).filter(function (data, index, array) {
								return data != array[index - 1] && (_type.YEAR == index || pInterval[0] <= data && data <= pInterval[1]);	// repeated values and out of bound
							}),
						};
					}

					throw "Malformed or not supported parameter: " + data + " " + index;
				}),
			}
		});
		
		this.ready = function (date) {
			var _this = this;
			return this.next() <= date && this.interval.every(function (data, index, array) {
				if (_type.WEEKDAY == index && _type.HASH == data.type) {
					throw "Not implemented yet";
				} else {
					if (_type.ASTERISK == data.wildcard
						|| 0 <= data.values.indexOf((_type.MONTH == index) + date["get" + methods[index][1]]())) {
						return true;
					} else {
						console.log(_this.id, index, date["get" + methods[index][1]](), data);
						return false;
					}
				}
			});
		};
		
		this.execute = function (cb) {
			var _this = this,
			pUpdate = function (next) {
				for (var ai = 0, at = _listeners.length;ai < at;++ai) {
					_listeners[ai].apply(null, arguments);
				}

				_this.update(next?new Date(next):_currentDate());
				cb(_this);
			},
			c = _currentDate();

			if (this.ready(c)) {
				console.log("2 READY", obj.id, c);
				if (obj.command.apply(obj, [pUpdate])) {
					pUpdate();
				} else {
					_debug("No synchronous response (possibly asynchronous)");
				}
			} else {
				_debug("2 WAIT", obj.id, c);
				pUpdate();
			}

			return this;
		};
		
		this.update = function (date) {
			date.setUTCMilliseconds(1000);
			var max = new Date(Date.UTC(date.getUTCFullYear(), 1 + date.getUTCMonth(), 0, 0, 0, 0, 0)).getUTCDate();

			for (var index = 0, at = this.interval.length;index < at;++index) {
				var method = methods[index],
				pInterval = this.interval[index],
				tInterval = pInterval.values,
				value = date["get" + method[1]](),
				tmp = [tInterval[0], (_type.DAY == index?max:method[0])];
				if (_type.DAY != index
					|| _type.HASH != pInterval.type
					|| value <= pInterval.step
					|| ~this.interval[_type.MONTH].values.indexOf(date.getUTCMonth())) {
					for (var bi = 0, bt = tInterval.length;bi < bt;++bi) {
						if (tInterval[bi] >= value) {
							tmp = [tInterval[bi], 0];
							break;
						}
					}
				}
				
				if (_type.WEEKDAY == index) {
					date.setUTCDate(date.getUTCDate() + tmp[0] + tmp[1] - value);
				} else if (_type.YEAR != index || 0 < tmp[0]) {
					//console.log(index, tmp[0], tmp[1], tmp[0] + tmp[1]);
					date["set" + method[1]](tmp[0] + tmp[1]);
				}
			}

			_debug("3 NEXT", obj.id, date);
			nextAt[obj.id] = date.valueOf();
			GM_setValue(nextAtKey, JSON.stringify(nextAt));

			return this;
		};

		this.next = function () {
			return nextAt[obj.id] || 0;
		};
		
		this.addListener = function (cb) {
			_listeners.push(cb);

			return this;
		};
		
		this.removeListener = function (cb) {
			var index = _listeners.indexOf(cb);
			if (~index) {
				return _listeners.splice(index, 1)[0];
			}
		};

		_debug(this);
	},
	tasks = [],
	_add = function (o) {
		var pInterval = o.next();
		for (var index = 0, at = tasks.length;index < at && pInterval >= tasks[index].next();++index) {}

		tasks.splice(index, 0, o);	// inserts 'o' at position 'index'
		_debug("0 ADD", o.id, pInterval, index);

		_updateTimer();
		
		return o;
	},
	_updateTimer = function () {
		clearTimeout(timer);

		if (tasks.length) {
			var cd = _currentDate(),
			n = tasks[0].next(),
			wait = Math.max(Math.min(n - cd, Math.pow(2, 31) - 1), 0);
			console.log("1 TIMER", tasks[0].id, cd, new Date(n), n - cd, wait);
			timer = setTimeout(function () {
				isDebug && alert("Ready...");
				tasks.shift().execute(_add);
			}, wait);
		}
	};
	
	this.getDate = function () {
		return _currentDate();
	};
	
	this.addTask = function (obj) {
		return _add(new Task(obj));
	};

	this.removeTask = function (o) {
		var index = -1,
		removed;

		if (typeof o == "string") {
			for (var ai = 0, at = tasks.length;ai < at;++ai) {
				if (o == tasks[ai].id) {
					index = ai;
					break;
				}
			}
		} else {
			index = tasks.indexOf(o);
		}

		if (~index) {
			removed = tasks.splice(index, 1)[0];
			if (!index) {	// index 0 removed
				_updateTimer();
			}
		}

		return removed;
	};
	
	this.addListener = function (taskId, cb) {
		for (var ai = 0, at = _tasks.length;ai < at;++ai) {
			if (taskId == _tasks[ai].id) {
				_tasks[ai].addListener(cb);
				break;
			}
		}

		return this;
	};

	this.removeListener = function (taskId, cb) {
		for (var ai = 0, at = _tasks.length;ai < at;++ai) {
			if (taskId == _tasks[ai].id) {
				_tasks[ai].removeListener(cb);
				break;
			}
		}

		return this;
	};

	this.reset = function () {
		nextAt = {};
		GM_deleteValue(nextAtKey);

		_updateTimer();
		
		return this;
	};
	
	_debug("0 DIFF", diff);
};
