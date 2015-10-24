// ==UserScript==
// @name        Includes : Neopets : Inventory
// @namespace   http://gm.wesley.eti.br
// @description Inventory Function
// @author      w35l3y
// @email       w35l3y@brasnet.org
// @copyright   2015+, w35l3y (http://gm.wesley.eti.br)
// @license     GNU GPL
// @homepage    http://gm.wesley.eti.br
// @version     1.0.0
// @language    en
// @include     nowhere
// @exclude     *
// @grant       GM_xmlhttpRequest
// @require     https://github.com/knadh/localStorageDB/raw/master/localstoragedb.min.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_XPath/63808.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_HttpRequest/56489.user.js
// @require     https://github.com/w35l3y/userscripts/raw/master/includes/Includes_Neopets_%5BBETA%5D/main.user.js
// ==/UserScript==

var Inventory = function(page){
	var _get = function(data,cb){
		page.request({
			method	 : "get",
			action	 : "http://www.neopets.com/inventory.phtml",
			delay	 : true,
			data     : data,
			callback : cb
		});
	},
	_getItem = function(data,cb){
    	if(!data.obj_id){
        	alert("[_getItem] obj_id is required");
    	}
    	page.request({
        	method   : "get",
        	action   : "http://www.neopets.com/iteminfo.phtml",
        	referer  : "http://www.neopets.com/inventory.phtml",
        	delay    : true,
        	data     : data,
        	callback : cb
    	});
	},
	_post = function(data,cb){
        if(!data.obj_id){
            alert("[_post] obj_id is required!");
        }
        if(!data.action){
            alert("[_post] action is required!");
        }

		page.request({
			method	 : "post",
			action	 : "http://www.neopets.com/useobject.phtml",
			referer  : "http://www.neopets.com/iteminfo.phtml?obj_id=" + data.obj_id,
			delay    : true,
			data	 : data,
			callback : cb
		});
	};

    this.execute = function(params){
        _post(params.data,function(obj){
            params.onsuccess(obj);
        });
    };

    this.info = function(params){
        _getItem(params.data,function(obj){
            var infoObj = {},
            info = xpath(".//table[@width='410']/tbody/tr",obj.body).map(function(row){
                infoObj[xpath("string(.//td[1]/b/text())",row).toLowerCase().replace(/[.]/g,"").replace(/ /g,"_")] = xpath("string(.//td[2]/text())",row);
                return infoObj;
            }),
            info = info[0];
            
            info.name = xpath("string(.//table[@cellpadding='5']/tbody/tr/td[2]/b[1]/following-sibling::text()[1])",obj.body).replace(" : ","");
                 
            if(xpath(".//form[@name='item_form']/select/option",obj.body).length > 0){
                var options = xpath(".//form[@name='item_form']/select/option",obj.body).map(function(option){
                    return {
                        "action" : xpath("string(.//@value)",option),
                        "text"   : xpath("string(.//text())",option)
                    }    
                });
                options.shift();
            }else{
                var options = false;
            }    
        
            params.onsuccess({ "info" : info, "options" : options });
        });
    }

	this.inventory = function(params){
		var items;
		
		_get({},function(obj){
			items = xpath(".//table[@class='inventory']/tbody//td/a/img[contains(@src,'http://images.neopets.com/items/')]/../..",obj.body).map(function(item){
				var imgUrl = xpath("string(.//a/img/@src)",item),
				id = xpath("string(.//a/@onclick)",item).split("(")[1].replace(");",""),
				info = xpath(".//text()",item),
				rarity,
				trading = wearable = false;
				
				if(typeof info[3] == "undefined"){
					if(typeof info[2] == "undefined"){
						if(typeof info[1] == "undefined"){}else{
							rarity = info[1].nodeValue.replace(/[()]/g,"");
							if(rarity == "wearable"){
								rarity = undefined;
								wearable = true;
							}
						}
					}else{
						rarity = info[2].nodeValue.replace(/[()]/g,"");
						trading = (info[1].nodeValue) ? true : false;
						if(rarity == "wearable"){
							rarity = undefined;
							wearable = true;
						}
					}
				}else{
					wearable = (info[1].nodeValue) ? true : false;
					trading = (info[2].nodeValue) ? true : false;
					rarity = info[3].nodeValue.replace(/[()]/g,"");
					if(rarity == "wearable"){
						rarity = undefined;
						wearable = true;
					}
				}
				
				return {
					"name"	   : info[0].nodeValue,
					"image"    : imgUrl,
					"id"	   : id,
					"rarity"   : rarity,
					"trading"  : trading,
					"wearable" : wearable
				};
			});				
			params.onsuccess({ "results" : items });	
		});
		
	};
};