// ==UserScript==
// @name           Neopets : Wheels
// @namespace      http://gm.wesley.eti.br
// @include        http://www.neopets.com/inventory.phtml
// @grant          GM_getValue
// @grant          GM.getValue
// @grant          GM_setValue
// @grant          GM.setValue
// @grant          GM_deleteValue
// @grant          GM.deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM.xmlHttpRequest
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require        https://gist.github.com/w35l3y/f824897032ae38af9595/raw/main.js
// @require        https://github.com/w35l3y/JSAMF/raw/master/web/web/amf.js
// ==/UserScript==
//GM.deleteValue("last_access");
var proxy = new RemotingProxy("http://www.neopets.com/amfphp/gateway.php" , "WheelService", amf.ObjectEncoding.AMF3),
la = JSON.parse(GM.getValue("last_access", "{}")),
wheels = [{
	id			: "5",	// monotony
	automatic	: false,
	interval	: function (c) {
		return -1;
	},
	execute		: function (proxy) {
		proxy.spinWheel(this.id);
	},
	message		: function (slot) {
		return [
			"A visit to the volcano.",
			"A regular codestone.",
			"A random Tyrannian weapon.",
			"Wheel of Monotony avatar.",
			"Tyrannian Petpet Paint Brush.",
			"A ticket for The Neopian Lottery.",
			"Your active pet loses half their health.",
			"Tyrannian Paint Brush.",
			"You win 5,000 NP!",
			"A Tyrannian food item.",	// 8.000000002793968
			"A random Monotony ite.",
			"One of your pets\' abilities is raised by one level.",
			"A red codestone.",
			"A visit to the Lair of the Beast.",	// 8.000000004656613
			"A Tyrannian Petpet.",
			"You win 20,000 NP!",
		][slot];
	},
}, {
	id			: "1",	// knowledge
	automatic	: false,
	interval	: function (c) {
		return c - 24 * 60 * 60 * 1000;
	},	// 24 hours
	execute		: function (proxy) {
		proxy.spinWheel(this.id);
	},
	message		: function (slot) {
		return [
			"A random Brightvale job coupon.",
			"A random food item.",
			"Your active pet\'s intelligence decreases.",
			"A random book.",
			"A random Brightvale window.",
			"A random Brightvale scroll.",
			"Brightvale Guard Plushie.",
			"Your active pet\'s intelligence increases.",	// <-- [7] 4.000000002793968
			"A \"Did you know...\" phrase.",	// (8)
			"Your active Neopet is healed.",	// (9)
			"The Brightvale avatar.",
			"Free spin.",
			"Advice from King Hagan.",
			"A random mote.",
			"Brightvale Usuki Doll.",
			"A random shield.",
		][slot];
	},
}, {
	id			: "2",	// excitement
	automatic	: true,
//	referer		: "http://images.neopets.com/wheels/wheel_of_excitement_v3_831fbec8f8.swf?r=60260779",
	interval	: function (c) {
		return c - 2 * 60 * 60 * 1000;
	},	// 2 hours
	execute		: function (proxy) {
		proxy.spinWheel(this.id);
	},
	message		: function (slot) {
		return [
			"Your pets lose some health.",
			"Your pets are healed.",
			"You win 2,500 NP!",
			"You win 500 NP!",
			"Your pets lose some health.",
			"A random magic item (including bottled faeries, morphing potions).",
			"You win 1,000 NP!",
			"One of your pets\' abilities is lowered by one level.",
			"Your active pet comes down with a disease (Chickaroo).",
			"A mystery amount of Neopoints (between 100 - 350 NP).",
			"You win 5,000 NP!",
			"\"Something mysterious happens to you and your pets... you are not sure what it is, however...\" Does nothing.",
			"The Pant Devil steals something from your inventory.",
			"You win 400 NP!",
			"You win 20,000 NP and an avatar!",
			"One of your pets\' abilities is raised by one level.",
		][slot];
	},
}, {
	id			: "3",	// mediocrity
	automatic	: false,
//	referer		: "http://images.neopets.com/wheels/wheel_of_mediocrity_v2_c4ed41eb31.swf",
	interval	: function (c) {
		return c - 40 * 60 * 1000;
	},	// 40 minutes
	execute		: function (proxy) {
		proxy.spinWheel(this.id);
	},
	message		: function (slot) {
		return [
			"A Grarrl roars at your Neopet (nothing happens).",
			"You win 4,000 NP and an avatar!",
			"One of your pets\' abilities is lowered by one level.",
			"You win 200 NP!",
			"You lose a random item in your inventory to a tar pit.",
			"One of your pets\' abilities is raised by one level.",
			"You win 2,000 NP!",
			"A pterodactyl swoops down and bites your active pet, causing it to lose some health.",
			"A random Tyrannian furniture item.",
			"You win 100 NP!",
			"A random Tyrannian petpet.",
			"A random Tyrannian food.",
			"You win 500 NP!",
			"Nothing happens.",
			"Fireballs rain down and singe your Neopets, causing them to lose some health.",
			"You win 1,000 NP!",
		][slot];
	},
}, {
	id			: "4",	// misfortune
	automatic	: false,
	interval	: function (c) {
		return c - 2 * 60 * 60 * 1000;
	},	// 2 hours
	execute		: function (proxy) {
		proxy.spinWheel(this.id);
	},
	message		: function (slot) {
		return [
			"Your pet comes down with a disease.",
			"A random gift.",
			"A random spooky petpet.",
			"You lose some Neopoints (it is possible to lose all the Neopoints you have on hand!).",
			"An item in your inventory is turned into a Pile of Sludge.",
			'Your pet will "forget" a book, so you\'ll have to read it to them again in order for it to show up on your pet\'s "Books Read" list.',
			"You win some Neopoints.",
			"The Pant Devil steals an item from your inventory!",
		][slot];
	},
}, {
	id			: "5",	// monotony
	automatic	: false,
	headers		: {
		"Referer"	: "http://www.neopets.com/prehistoric/monotony/monotony.phtml",
	},
	interval	: function (c) {
		return c - 24 * 60 * 60 * 1000;
	},	// 24 hours
	execute		: function (proxy) {
		proxy.startMonotony();
	},
}, {
	id			: "6",	// extravagance
	automatic	: false,
	interval	: function (c) {
		return c - 24 * 60 * 60 * 1000;
	},	// 24 hours
	execute		: function (proxy) {
		proxy.spinWheel(this.id);
	},
	message		: function (slot) {
		return [
			"Nothing.",
			"You win 25,000 NP!",
			"A random Nerkmid, Secret Laboratory Map piece, or job coupon.",
			"A paint brush (e.g., Mystery Island Paint Brush, Zombie Paint Brush).",
			"You win 50,000 NP!",
			"Wheel of Extravagance avatar.",
			"The Wheel of Extravagance Background.",
			"+5 of a random statistic (e.g., hit points, strength, defence, movement, intelligence) for your active pet.",
			"You win 100,001 NP!",
			"The Wheel of Extravagance Stamp.",
			"+10 of a random statistic (e.g., hit points, strength, defence, movement, intelligence) for your active pet. Alternatively, it could be a 10% increase if your pet's stats are fairly low to begin with.",
			"A rarity 100 item (e.g., Chocoon, Glittery Scorchstone).",
		][slot];
	},
}],
resultCallback = function (cb) {
	return function (body, ctx) {
		console.log(body);

		cb.apply(this, [body, ctx]);

		if ("undefined" == typeof(body)) {
			console.log("AMFMessage 0 body", "(undefined)");
		} else if (body.error) {
			alert(body.errmsg);
		}
	};
},
statusCallback = function (status, ctx) {
	console.log("Status", status);
};
proxy.addHandler("spinWheel", resultCallback(function (body, ctx) {
	var wheel = ctx.wheel;

	if (body.spinagain) {
		la[wheel.id] = 0;
	}

	console.log(wheel.message && wheel.message(Math.floor(body.slot, 10)), body.reply, body.toSource());
}), statusCallback);
proxy.addHandler("startMonotony", resultCallback(function (body, ctx) {
	window.setTimeout(function () {
		ctx.wheel = wheels[0];
		wheels[0].execute(ctx);
	}, 5000);
}), statusCallback);

//proxy.spinWheel("1");		// Wheel of Knowledge
//proxy.spinWheel("2");		// Wheel of Excitement
//proxy.spinWheel("3");		// Wheel of Mediocrity
//proxy.startMonotony();	// Wheel of Monotony
//proxy.spinWheel("5");		// Wheel of Monotony

(function recursive (list, index) {
	if (index < list.length) {
		var wheel = list[index],
		curr = new Date();

		if (wheel.automatic && (!la[wheel.id] || wheel.interval(curr) > la[wheel.id])) {
			la[wheel.id] = curr.valueOf();
			proxy.wheel = wheel;
			wheel.execute(proxy);
			window.setTimeout(recursive, 5000 + Math.ceil(5000 * Math.random()), list, ++index);
		} else {
			recursive(list, ++index);
		}
	} else {
		GM.setValue("last_access", JSON.stringify(la));
	}
}(wheels, 0));

/*
http://www.neopets.com/faerieland/wheel.phtml
%00%03%00%00%00%01%00%16WheelService.spinWheel%00%02/1%00%00%00%09%0A%00%00%00%01%02%00%012

http://www.neopets.com/prehistoric/mediocrity.phtml
%00%03%00%00%00%01%00%16WheelService.spinWheel%00%02/1%00%00%00%09%0A%00%00%00%01%02%00%013

-----------------------------

%00%00%00%01%00%12AppendToGatewayUrl%00%00%00%00.%02%00+?PHPSESSID=d631a79c2daffbd843723fb6ff29213b%00%01%00%0B/0/onResult%00%04null%00%00%01%13%03%00%04slot%00@.%00%00%00%00%00%00%00%05reply%02%00%D6<center>Huh, that prize isn't so bad. Enjoy it, I guess.<br/><br/><img hspace=\"78\" src=\"http://images.neopets.com/items/gif_bag_of_neopoints.gif\" width=\"80\" height=\"80\"><br/><br/><br/><br/><b>1,000 NP<br/></center>%00%09spinagain%01%00%00%08reaction%00?%F0%00%00%00%00%00%00%00%00%09
%00%00%00%01%00%12AppendToGatewayUrl%00%00%00%00.%02%00+?PHPSESSID=d631a79c2daffbd843723fb6ff29213b%00%01%00%0B/0/onResult%00%04null%00%00%01b%03%00%04slot%00@%1C%00%00%00%00%00%00%00%05reply%02%01%25<center><font size="-4">So it wasn't a good prize, but at least it wasn't mediocre, right?<br/><br/><img hspace="78" src="http://images.neopets.com/wheels/prizes/pterodactyl.gif" width="80" height="80"><br/><br/><br/><br/><br/>A Pterodactyl swoops down and bites <b>w35l3y</b>!</font></center>%00%09spinagain%01%00%00%08reaction%00@%00%00%00%00%00%00%00%00%00%09

?ð%00%00%00%00%00%00
1
63,240,0,0,0,0,0,0
1
0
0

@%00%00%00%00%00%00%00
2
64,0,0,0,0,0,0,0
1
0
1

@%1C%00%00%00%00%00%00
4.000000002793968
64,28,0,0,0,0,0,0
1
3145728
2

@.%00%00%00%00%00%00
8.000000006519258
64,46,0,0,0,0,0,0
1
3670016
3

%00%00%00%01%00%12AppendToGatewayUrl%00%00%00%00.%02%00+?PHPSESSID=d631a79c2daffbd843723fb6ff29213b%00%01%00%0B/0/onStatus%00%04null%00%00%025%03%00%0Bdescription%02%01%A6Transaction "UPDATE personal SET neopoints = neopoints - 500 WHERE username = 'wesleywillame'%3B UPDATE neopets SET current_hp = FLOOR%28current_hp / 3%29 WHERE owner = 'wesleywillame' AND current_hp >= 4 LIMIT 4%3B INSERT INTO play_limiter2 %28username, unixtime, game_id, plays%29 VALUES %28'wesleywillame', 1337470455, 'wheel_excitement', 1%29 ON DUPLICATE KEY UPDATE plays = plays + 1%3B " failed: Query 2 of transaction matched nothing%00%07details%02%00'/home/neopets/common/db/db_funcs_v1.inc%00%05level%02%00%12Unknown error type%00%04line%00@%7F %00%00%00%00%00%00%04code%02%00%14AMFPHP_RUNTIME_ERROR%00%00%09

*/