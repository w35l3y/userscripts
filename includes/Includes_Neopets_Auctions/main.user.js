// ==UserScript==
// @name        Neopets : Includes : Auctions
// @namespace   github.com
// @include     nowhere
// @exclude     *
// @version     1
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @require     http://code.jquery.com/jquery-latest.js
// @require     https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js?2387
// ==/UserScript==

// auctions.phtml?type=placebid
// { _ref_ck : neo.ck, amount : 245000, auction_id : auctionid }

var Auctions = function(page){
    var _post = function(data, cb){
		page.request({
			method	: "post",
			action	: "http://www.neopets.com/auctions.phtml?type=placebid",
			referer	: referer,
			data	: data,
			delay	: true,
			callback: cb
		});
    },
    _get = function(data,cb){
        page.request({
           method   : "get",
           action   : "http://www.neopets.com/auctions.phtml",
           data     : data,
           delay    : true,
           callback : cb
        });
    };
    
    this.test = function(cb){
        _get({ "auction_counter" : 40 },function(o){
            if(xpath(".//td[@class = 'content']//b[contains(text(),'Oops')]/text()",o.body).length > 0){
                o.error = true;
                o.errmsg = xpath("string(.//td[@class = 'content']//b[contains(text(),'Oops')]/text())",o.body) + xpath("string(.//td[@class = 'content']//b[contains(text(),'Oops')]/../text())",o.body);         
            }else{
                o.items = xpath(".//td[@class = 'content']//table[@cellpadding = '3']//tbody/tr[position()>1]",o.body).map(function(row){
                    return {
                        id           : parseInt(xpath("string(td[3]/a/@href)",row).split("=")[2],10),
                        name         : xpath("string(td[3]/a/text())",row),
                        owner        : xpath("string(td[4]/font/text())",row),
                        timeleft     : xpath("string(td[5]/b/font/text())",row),
                        lastbid      : parseInt(xpath("string(td[6]/b/text())",row),10),
                        currentprice : parseInt(xpath("string(td[7]/b/text())",row),10),
                        lastbidder   : xpath("string(td[8]/font/text())",row)
                    }
                });
            }
            
            cb(o);
        });
    };  
};