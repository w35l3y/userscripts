// reddit (#50)
// example https://www.reddit.com/user/twoforjoy
FoodClub.templates.push(function (doc, findArenaBy, findPirateBy) {
	var arenas2 = ["shipwreck", "lagoon", "treasure", "hidden", "harpoon"],
		pirates2 = [
			"dan",
			"sproggie",
			"orvinn",
			"lucky",
			"edmund",
			"peg leg",
			"bonnie",
			"puffo",
			"stuff",
			"squire",
			"crossblades",
			"stripey",
			"ned",
			"fairfax",
			"gooblah",
			"franchisco",
			"federismo",
			"blackbeard",
			"buck",
			"tailhook"
		];

	return {
		list	: Array.prototype.concat.apply([], xpath(".//table[thead/tr[th['Odds' = text()]]/th[7 = position()] or tbody/tr[1][th['Odds' = text()]]/th[7 = position()]]", doc).map(function (table) {
			var headers = [], odds, round;

			xpath("./thead/tr/th|./tbody/tr[1]/th", table).forEach(function (column, index) {
				var key = column.textContent.trim().split(/\s+/)[0].toLowerCase(),
					posKey = arenas2.indexOf(key);

				headers[index] = -1 < posKey && findArenaBy(1 + posKey);

				if ("odds" == key) {
					odds = index;
				} else if (isFinite(key)) {
					round = parseInt(key, 10);
				}
			});

			return odds && round && xpath("./tbody/tr[td]", table).map(function (bet, rowIndex) {
				return {
					round	: round,
					arenas	: Array.prototype.slice.apply(bet.cells).map(function (column, cellIndex) {
						if (headers[cellIndex]) {
							var key = column.textContent.trim().toLowerCase().replace(/\*+/g, "");
							if (key) {
								var posKey = pirates2.indexOf(key),
									pirate = findPirateBy(-1 < posKey?1 + posKey:key);

								if (pirate) {
									var h = JSON.parse(JSON.stringify(headers[cellIndex]));	// deep copy
									h.pirate = pirate;
									return h;
								}

								console.error("Unknown pirate", key);
								throw "Unknown pirate";
							}
						}
					}).filter(function (column) {
						return column;
					}),
					odds	: parseInt(bet.cells[odds].textContent.trim().slice(0, -2).replace(/\D+/g, ""), 10)
				};
			}).filter(function (bet) {
				return 0 < bet.arenas.length;
			});
		}))
	};
});
