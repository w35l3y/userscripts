// ==UserScript==
// @name           Includes : Neopets Stock Market [BETA]
// @description    Stock Function
// @grant		   GM_xmlhttpRequest
// @include        nowhere
// @require 	   https://github.com/w35l3y/userscripts/raw/master/scripts/X/../../includes/Includes_XPath/63808.user.js
// @require 	   https://github.com/w35l3y/userscripts/raw/master/scripts/../../../raw/master/includes/Includes_HttpRequest/56489.user.js
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

if (!StockMarket) {
	var StockMarket = function () {};
}

StockMarket.tickers = function (params) {
	var data = {
		"type"	: "list",
		"full"	: "true"
	};

	HttpRequest.open({
		"method"	: "get",
		"url"		: "http://www.neopets.com/stockmarket.phtml",
		"onsuccess"	: function (xhr) {
			var tickers = xpath(".//td[@class ='content']//table//tr[position()>1]",xhr.response.xml).map(function(stock){
				return {
					"ticker" : xpath("string(.//td[2]/a/b/text())",stock),
					"company" : xpath("string(.//td[3]/text())",stock),
					"volume" : parseInt(xpath("string(.//td[4]/text())",stock),10),
					"open" : parseInt(xpath("string(.//td[5]/b/text())",stock),10),
					"current" : parseInt(xpath("string(.//td[6]/b/text())",stock),10),
					"change" : parseFloat(xpath("string(.//td[7]/font/b/text())",stock).replace(/[%+]/g,''))
				};
			});
			params.callback({
				list	: tickers,
				data	: data
			});
		}
	}).send(data);
};

StockMarket.portfolio = function (params) {
	var data = {
		"type"	: "portfolio"
	};

	HttpRequest.open({
		"method"	: "get",
		"url"		: "http://www.neopets.com/stockmarket.phtml",
		"onsuccess"	: function (xhr) {
			var totalsRow = xpath("id('postForm')/table/tbody/tr[@bgcolor='#BBBBBB']",xhr.response.xml)[0];
					
			var totals = {
				"totals" : parseInt(xpath("string(.//td[2]/b/text())",totalsRow).replace(/,/g,""),10),
				"paid" : parseInt(xpath("string(.//td[3]/b/text())",totalsRow).replace(/,/g,""),10),
				"value" : parseInt(xpath("string(.//td[4]/b/text())",totalsRow).replace(/,/g,""),10),
				"change" : parseFloat(xpath("string(.//td[5]/b/font/text())",totalsRow).replace(/[+%]/g,""))
			};
			
			var tickers = xpath("id('postForm')/table/tbody/tr[not(@id) and position()>2]",xhr.response.xml).map(function(stock){
				var img = xpath(".//td[1]/img",stock)[1];			
				if(typeof img === "undefined"){
				}else{
					return {
						"image" : img.getAttribute("src"),
						"ticker" : xpath("string(.//td[2]/a/text())",stock),
						"open" : parseInt(xpath("string(.//td[3]/text())",stock),10),
						"current" : parseInt(xpath("string(.//td[4]/text())",stock),10),
						"changeToday" : parseInt(xpath("string(.//td[5]/font/b/text())",stock).trim().replace(/[+]/g,""),10),
						"quantity" : parseInt(xpath("string(.//td[6]/text())",stock).replace(/,/g,""),10),
						"amountPaid" : parseInt(xpath("string(.//td[7]/text())",stock).replace(/,/g,""),10),
						"currentValue" : parseInt(xpath("string(.//td[8]/text())",stock).replace(/,/g,""),10),
						"changeOverall" : parseFloat(xpath("string(.//td[9]/font/b/nobr/text())",stock).replace(/[%+]/g,''),10)
					};
				}
			});
			
			tickers.pop();
		
			params.callback({
				totals	: totals,
				list	: tickers,
				data	: data
			});
		}
	}).send(data);
};

// usage
// StockMarket.buy({
// 	"data" : {
// 		"ticker_symbol" : "AAVL",
// 		"amount_shares" : 1000,	
// 	},
// 	"callback" : function(obj){
// 		console.log(obj);
// 	}
// });

StockMarket.buy = function (params) {
	// todo: make stock buy function
	// post via process_stockmarket.phtml
	// referrer: http://www.neopets.com/stockmarket.phtml?type=buy
	
	var data = {
		"type" : "buy",
		"amount_shares" : 1000 // default amount
	};
		
};

StockMarket.sell = function (params) {
	// todo: make stock sell function
};