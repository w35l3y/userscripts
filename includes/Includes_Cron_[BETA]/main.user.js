// ==UserScript==
// @name        Includes : Cron [BETA]
// @namespace   http://gm.wesley.eti.br
// @description Cron Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.4.4
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
		SLASH	: 2
	},
	intervals = [
		[0, 59, 60, "UTCSeconds"],	// second
		[0, 59, 60, "UTCMinutes"],	// minute
		[0, 23, 24, "UTCHours"],	// hour
		[1, 31, 0, "UTCDate"],	// day
		[1, 12, 12, "UTCMonth"],	// month
		[0, 6, 7, "UTCDay"],		// weekday
		[0, 0, 0, "UTCFullYear"]		// year
	],
	unLoad = function (e) {
		e.returnValue = "Cron is being executed...";
	},
	Task = function (obj) {
		var _current = _currentDate(),
		map = {
					// s m h D M d Y
			reboot	: "? ? ? ? ? ? ?",				// unchanged
			yearly	: "*#0 *#0 *#0 *#1 *#1 * *",	// "0 0 0 1 1 * *",
			monthly	: "*#0 *#0 *#0 *#1 * * *",		// "0 0 0 1 * * *",
			weekly	: "*#0 *#0 *#0 * * *#0 *",		// "0 0 0 * * 0 *",
			daily	: "*#0 *#0 *#0 * * * *",		// "0 0 0 * * * *",
			midnight: "0 0 0 * * * *",				// unchanged
			hourly	: "*#0 *#0 * * * * *"			// "0 0 * * * * *",
		},
		_listeners = [],
		_execute = function (mode, cb) {
			window.addEventListener("beforeunload", unLoad, false);

			var _this = this,
			pUpdate = function (success, next) {
				for (var ai = 0, at = _listeners.length;ai < at;++ai) {
					_listeners[ai].apply(null, arguments);
				}

				var n = _this.update(success, next);
				cb(_this);

				window.removeEventListener("beforeunload", unLoad);
				return n;
			},
			c = _currentDate();

			if (this.ready(c)) {
				console.log("2 READY", obj.id, c);
				if (obj.command.apply(obj, [mode, pUpdate])) {
					pUpdate(true);
				} else {
					_debug("No synchronous response (possibly asynchronous)");
				}
			} else {
				console.debug("2 WAIT", obj.id, c);
				pUpdate(false);
			}
			
			return this;
		};

		Object.defineProperties(this, {
			id	: {
				enumerable	: true,
				value	: obj.id
			},
			priority	: {
				value	: obj.priority
			},
			delay		: {
				value	: obj.delay
			},
			interval	: {
				enumerable	: true,
				value	: ((obj.interval || "*").replace(/^@(\w+)$/, function ($0, $1) {
					return ($1 in map?map[$1]:$0);
				}) + " * * * * * *").trim().split(/\s+/g).slice(0, 7).map(function (data, index, array) {
					if (/^([\*\?]|\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)(?:([\#\/])(\d+))?$/.test(data)) {
						var type = 1 + "#/".indexOf(RegExp.$2 || undefined),
						step = (RegExp.$3?parseInt(RegExp.$3, 10):1),
						currentValue = _current["get" + intervals[index][3]](),
						pInterval = intervals[index].slice(0, 2),
						wildcard = 1 + "*?".indexOf(RegExp.$1 || undefined);

						return {
							step	: step,
							type	: type,
							wildcard: wildcard,
							values	: RegExp.$1
							.replace("?", function () {
								return currentValue + (step?currentValue % step:0);
							})
							.replace("*", pInterval.join("-"))
							.replace(/(\d+)-(\d+)/g, function ($0, $1, $2) {
								var opts = [parseInt($1, 10) + (obj.relative && step?currentValue % step:0)],
								s = (_type.ASTERISK == wildcard && step && !obj.relative?step:1);

								for (var ai = opts[0] + s, at = parseInt($2, 10);ai <= at;ai += s) {
									opts.push(ai);
								}
								return opts.join(",");
							}).split(",").map(function (data) {
								return parseInt(data, 10) - (_type.MONTH == index);	// parse numbers
							}).sort(function (a, b) {
								return (a > b?1:-1);	// asc
							}).filter(function (data, i, array) {
								return data != array[i - 1]
									&& (_type.YEAR == index || (_type.MONTH != index || isFinite(--data)) && pInterval[0] <= data && data <= pInterval[1]);	// repeated values and out of bound
							}),
						};
					}

					throw "Malformed or not supported parameter: " + data + " " + index;
				})
			}
		});
		
		this.ready = function (date) {
			var _this = this;

			return this.interval.every(function (data, index, array) {
				if (_type.ASTERISK == data.wildcard
					|| 0 <= data.values.indexOf(date["get" + intervals[index][3]]())) {
					return true;
				} else {
					// TODO should be removed once it is tested
					console.log("SKIP", _this.id, index, date["get" + intervals[index][3]](), data);
					return false;
				}
			});
		};
		
		this.update = function (success, date) {
			if (!date) {
				date = _currentDate();
				date.setUTCMilliseconds(0);
				var max = new Date(Date.UTC(date.getUTCFullYear(), 1 + date.getUTCMonth(), 0, 0, 0, 0, 0)).getUTCDate(),
				errorCount = 0;

				for (var index = 0, at = this.interval.length;index < at;++index) {
					var method = intervals[index],
					pInterval = this.interval[index],
					tInterval = pInterval.values,
					value = date["get" + method[3]](),
					tmp = [tInterval[0], (_type.DAY == index?max:method[2])],
					inList = ~tInterval.indexOf(value);
					
					if ((success || _type.ASTERISK == pInterval.wildcard) && inList) {
						if (_type.HASH == pInterval.type) {
							if (_type.WEEKDAY == index) {
								var dd = date.getUTCDay();
								date.setUTCDate(pInterval.step - dd + date.getUTCDate() + (obj.relative?value:tmp[1]) * (dd >= pInterval.step));
							} else {
								date["set" + method[3]](pInterval.step + (obj.relative?value:tmp[1]));
							}
						} else if (_type.SLASH == pInterval.type || _type.SECOND == index) {
							if (_type.WEEKDAY == index) {
								throw "Not implemented yet";
							} else {
								date["set" + method[3]](pInterval.step + value);
							}
						}
					} else {
						if (errorCount && inList && !success) {
							break;
						} else {
							++errorCount;
						}

						for (var bi = 0, bt = tInterval.length;bi < bt;++bi) {
							if (tInterval[bi] > value) {
								tmp = [tInterval[bi], 0];
								break;
							}
						}

						if (_type.WEEKDAY == index) {
							// under test
							date.setUTCDate(date.getUTCDate() + tmp[0] + tmp[1] - value);
						} else if (_type.YEAR != index || 0 < tmp[0]) {
							date["set" + method[3]](tmp[0] + tmp[1]);

							if (!obj.relative) {
								// reset prior indexes
								for (var ci = 0;ci < index;++ci) {
									if (_type.WEEKDAY != ci) {
										date["set" + intervals[ci][3]](this.interval[ci].values[0]);
									}
								}
							}
						}
					}
				}
			} else if (!(date instanceof Date)) {
				date = new Date(date);
			}

			_debug("3 NEXT", obj.id, date);
			nextAt[obj.id] = date.valueOf();
			GM_setValue(nextAtKey, JSON.stringify(nextAt));

			return date;
		};

		this.execute2 = function (cb) {
			var c = _currentDate();

			if (this.next() > c) {
				console.debug("2 DELAY", obj.id, c);
				cb(this);
			} else {
				_execute.apply(this, [true, cb]);
			}

			return this;
		},

		
		this.execute = function (cb) {
			_execute.apply(this, [false, cb]);
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
	},
	tasks = [],
	runKey = id + "-runKey",
	_add = function (o) {
		var _curr = _currentDate(),
		pInterval = o.next();
		for (var index = 0, at = tasks.length;index < at;++index) {
			var t = tasks[index],
			v = t.next();
			if (pInterval <= _curr) {
				if (v > _curr || o.priority < t.priority || isFinite(o.priority) && t.priority === undefined) {
					v <= _curr && console.log("0 PRIOR", o.id, t.id);
					break;
				}
			} else if (pInterval < v
				|| pInterval == v
				&& (o.priority < t.priority || isFinite(o.priority) && t.priority === undefined)) {
					pInterval == v && console.log("1 PRIOR", o.id, t.id);
					break;
			}
		}

		tasks.splice(index, 0, o);	// inserts 'o' at position 'index'
		console.debug("0 ADD", new Date(pInterval), index, o.id);

		_updateTimer();
		
		return o;
	},
	_updateTimer = function () {
		clearTimeout(timer);

		if (tasks.length) {
			var cd = _currentDate(),
			n = tasks[0].next(),
			wait = Math.max(Math.min(n - cd, Math.pow(2, 31) - 1), 0);
			//console.log("1 TIMER", tasks[0].id, cd, new Date(n), n - cd, wait);
			timer = setTimeout(function () {
				var curr = new Date(),
				wait2 = curr - Date.parse(localStorage.getItem(runKey));
				nextAt = JSON.parse(GM_getValue(nextAtKey, JSON.stringify(nextAt)));
				console.log(location.href);
				if (wait2 < 30000) {	// tries to solve concurrent executions
					console.log("A task is being executed in another TAB", wait2);
					setTimeout(_updateTimer, 30000 - wait2 + Math.floor(500 * Math.random()));
				} else {
					curr.setUTCMilliseconds(tasks[0].delay || 0);
					localStorage.setItem(runKey, curr.toISOString());
					//isDebug && alert("Ready...");
					tasks.shift().execute2(function (o) {
						localStorage.removeItem(runKey);
						_add(o);
					});
				}
			}, wait);
		}
	};
	
	window.addEventListener("storage", function (e) {
		if (runKey == e.key && e.oldValue != e.newValue) {
			setTimeout(_updateTimer, Math.floor(500 * Math.random()));
		}
	}, false);
	
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
	
	console.debug("0 DIFF", diff);
};
