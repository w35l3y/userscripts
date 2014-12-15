Usage Example:

Get all shops and log all the details to the console!
```
JellyNeo.shops({
	"callback" : function (obj) { // what to do once it's gotten all shops
		obj.list.forEach(function (item, index) {
		  console.log(index) // log which shop it is
		  console.log(item.name);
		  console.log(item.npLink.params.obj_type);
		  console.log(item.jnLink.raw);
		});
	}
});
```

Get all items from category '15' (Battle Magic) and log all the details to the console!
```
JellyNeo.ItemDatabase.find({
	"pages"	: -1, // get all items from the cateogry not just the first page
	"data"	: { // you can use any get method in JellyNeo url scheme
		"sortby" : "price",
		"r1" : "1", // rarity limit (only 1-99 stock in main shops)
		"r2" : "99",
		"cat" : "15",
		"p1" : "1",
		"p2" : "100000" // to limit it to only the items worth under 100k
	},
	"callback" : function (obj) { // what to do once it's gotten all the items
		obj.list.forEach(function (item, index) {
		  console.log(index) // log which item it is
		  console.log(item.id);
		  console.log(item.name);
		  console.log(item.image);
		  console.log(item.price);
		});
	}
});
```
