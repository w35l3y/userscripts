// ==UserScript==
// @name           Trello : Print board
// @namespace      http://gm.wesley.eti.br
// @description    Adds "Print board" button to the header of the board
// @author         w35l3y
// @email          w35l3y@brasnet.org
// @copyright      2015+, w35l3y (http://gm.wesley.eti.br)
// @license        GNU GPL
// @homepage       http://gm.wesley.eti.br
// @version        1.0.0
// @include        https://trello.com/b/*/*
// @icon           http://gm.wesley.eti.br/icon.php?desc=scripts/Trello_Print_board/main.user.js
// @grant          GM_openInTab
// @grant          GM_getResourceText
// @resource       print-boardCss http://pastebin.com/download.php?i=gpNrTUkh
// @require        http://code.jquery.com/jquery-2.1.3.js
// @require        http://api.trello.com/1/client.js?key=05e1b25a9057bb2aecbc99363285a8c2&dummy=.js
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

var openInBackground = true,
onAuthorize = function () {
	if (/\/b\/(\w+)/.test(location.pathname)) {
		Trello.boards.get(RegExp.$1, {
			cards	: "all",
			lists	: "all",
			card_checklists: "all"
		}, function (board) {
			var $ulList = $("<ul>"),
			$check = $("<input type='checkbox'>")
			.addClass("checkbox"),
			$hr = $("<hr>").addClass("hr");

			$.each(board.lists, function(ix, list) {
				var $liList = $("<li>")
				.text(list.name)
				.addClass("list")
				.appendTo($ulList),
				$ulCard = $("<ul>").appendTo($liList);
				$hr.clone().appendTo($liList);

				$.each(board.cards.filter(function (card) {
					return card.idList == list.id;
					}), function (ix, card) {
					var $liCard = $("<li>")
					.text(card.name)
					.prepend($check.clone().prop("checked", card.closed))
					.addClass("card")
					.appendTo($ulCard),
					$ulChecklist = $("<ul>").appendTo($liCard);

					$.each(card.checklists, function (ix, checklist) {
						var $liChecklist = $("<li>")
						.text(checklist.name)
						.addClass("checklist")
						.appendTo($ulChecklist),
						$ulItem = $("<ul>").appendTo($liChecklist);

						$.each(checklist.checkItems, function (ix, item) {
							var $liItem = $("<li>")
							.text(item.name)
							.prepend($check.clone().prop("checked", "complete" == item.state))
							.addClass("item")
							.appendTo($ulItem);
						});
					});
				});
			}); 

			if (openInBackground) {
				$("#print-document")
				.contents()
				.find("body")
				.html($ulList);

				$("#print-document")[0]
				.contentWindow
				.print();
			} else {
				throw "Not implemented yet";
				/*
				GM_openInTab("#").addEventListener("load", function (e) {
					var win = e.relatedTarget;

					$(win.document.head).append($("<style>", {
						type	: "text/css"
					}).text(GM_getResourceText("print-boardCss")));
					$(win.document.body).html($ulList);

					win.print();
				}, false);
				*/
			}
		});
	} else {
		alert("No board found");
	}
};

$("#content").one("DOMNodeInserted", "#permission-level", function (e) {
	$("<a>", {
		id	: "print-board",
		title	: "Print this board.",
		href	: "#",
	})
	.hide()
	.addClass("board-header-btn")
	.append($("<span>").addClass("board-header-btn-icon icon-sm icon-camera"))
	.append($("<span>").addClass("board-header-btn-text").text("Print"))
	.append($("<iframe>", {
		id	: "print-document"
	}).hide())
	.insertAfter($("#permission-level"))
	.on("click", function () {
		Trello.authorize({
			type		: "popup",
			name		: "Trello : Print board",
			persist		: true,
			expiration	: "never",
			success		: onAuthorize,
			error		: function () {
				alert("Erro");
			},
		});
	});

	if (openInBackground) {
		$("#print-document").load(function () {
			$("#print-document")
			.contents()
			.find("head")
			.append($("<style>", {
				type	: "text/css"
			}).text(GM_getResourceText("print-boardCss")));

			$("#print-board").show();
		});
	} else {
		$("#print-board").show();
	}
});
