// ==UserScript==
// @name           Includes : Message
// @namespace      http://gm.wesley.eti.br
// @description    Adds messages to the document body
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2014+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.1
// @language       en
// @include        nowhere
// @exclude        *
// @icon           http://gm.wesley.eti.br/icon.php?desc=includes/Includes_Message/main.user.js
// @grant          GM_log
// @grant          GM.log
// @grant          GM_addStyle
// @grant          GM.addStyle
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_getResourceText
// @grant          GM.getResourceText
// @resource       messageContainerCss ../../includes/Includes_Message/resources/css/messageContainer.css
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        ../../includes/Includes_Template_%5BBETA%5D/176400.user.js
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

Message = function () {
	var _this = this;

	switch (GM.getValue("MessageType", 0)) {
		case 0:
			GM.addStyle(GM.getResourceText("messageContainerCss"));
			var container = document.createElement("div"),
			timedMessage = function (ctx) {
				var sum = 1;
				ctx.timer = setInterval(function () {
					if (sum > 0) {
						sum -= 1/(ctx.opts.max/ctx.opts.min);
						ctx.node.style.opacity = sum;
					} else {
						if (!--_this.totalMessages) {
							ctx.node.parentNode.style.display = "none";
						}
						clearInterval(ctx.timer);
						ctx.node.parentNode.removeChild(ctx.node);
					}
				}.bind(_this), ctx.opts.min);
			};

			_this.totalMessages = 0;

			container.setAttribute("id", "messageContainerGroup");
			container.style.display = "none";
			document.body.appendChild(container);

			this._add = function (msgs, opts) {
				container.style.display = "block";
				var group = [].concat(msgs),
				o = {
					ini		: 5000,
					min		: 40,
					max		: 4000,
					fixed	: opts && !!opts.error,
					append	: true,
				};
				if (typeof(opts) == "object") {
					for (var k in opts) {
						o[k] = opts[k];
					}
				}

				group.forEach(function (m) {
					var text = document.createElement("div"),
					msg = m; // Template.get(m, {})
					text.setAttribute("class", "messageContainerDiv");
					text.style.opacity = 1;
					text.innerHTML = msg;
					container.insertBefore(text, o.append?null:container.firstChild);
					var cm = {
						node	: text,
						opts	: o,
						created_at	: new Date(),
						parent	: (group[0] == msg?null:group[0]),
					};
					GM.log([cm.created_at, msg]);
					if (!cm.opts.fixed) {
						cm.timer = setTimeout(function (cm) {
							timedMessage.call(_this, cm);
						}.bind(_this), o.ini, cm);
					}
					++_this.totalMessages;
				});
			};
			break;
		case 1:
			_this._add = function () {
				GM.log([new Date()].concat(Array.prototype.slice.apply(arguments)));
			};
			break;
		case 2:
			_this._add = console.log;
			break;
	}
};

Message.add = function () {
	this._add.apply(this, Array.prototype.slice.apply(arguments));
}.bind(new Message());
