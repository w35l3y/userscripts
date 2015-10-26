// ==UserScript==
// @name        Includes : Neopets : QuickStock
// @namespace   http://gm.wesley.eti.br
// @description QuickStock Function
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

var QuickStock = function(page){
    var _get = function(cb){
		page.request({
            method   : "get",
            action   : "http://www.neopets.com/quickstock.phtml",
            delay    : true,
            data     : {},
            callback : cb
        });
    },
    _post = function(data,cb){
        page.request({
           method   : "post",
           action   : "http://www.neopets.com/process_quickstock.phtml",
           referer  : "http://www.neopets.com/quickstock.phtml",
           delay    : true,
           data     : data,
           callback : cb 
        });
    };

    this.items = function(params){
        _get(function(obj){
            var inputs = xpath(".//form[@name='quickstock']/table/tbody/tr//input[@type='hidden']",obj.body);
            if(inputs.length > 1){
                var items = inputs.map(function(input){
                    var options = xpath("../td/input/@value",input).map(function(option){
                        return xpath("string(.)",option);
                    });
                    return {
                        "value"   : parseInt(xpath("string(@value)",input),10),
                        "order"   : xpath("string(@name)",input).split("[")[1].replace("]",""),
                        "item"    : xpath("string(.//preceding-sibling::td/text())",input),
                        "options" : options
                    };
                });
                params.onsuccess({ "available" : true, "items" : items });
            }else{
                params.onsuccess({ "available" : false });
            }
        });
    };
    
    this.depositAll = function(params){
        this.items({
            "onsuccess" : function(obj){
                dataTmp = {};
        
                if(obj.available){
                    obj["items"].forEach(function(curItem){
                        dataTmp["id_arr["+curItem.order+"]"] = curItem.value;
                        dataTmp["radio_arr[" + curItem.order + "]"] = "deposit";
                    });
                    
                    dataTmp.buyitem = 0;
                    _post(dataTmp,function(obj){
                        params.onsuccess(obj);
                    });
                }
            }
        });
    };
};