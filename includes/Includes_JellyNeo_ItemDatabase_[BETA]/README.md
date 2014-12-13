Usage Example:

Get all items from category '15' (Battle Magic) and log all the details to the console!
```
JellyNeo.ItemDatabase.find({
	pages : -1, // get all items from the cateogry not just the first page
	"data" : { // you can use any get method in JellyNeo url scheme
		"sortby" : "price",
		"r1" : "1", // rarity limit (only 1-99 stock in main shops)
		"r2" : "99",
		"cat" : "15",
		"p1" : "1",
		"p2" : "100000" // to limit it to only the items worth under 100k
	},
	"callback" : function (list) { // what to do once it's gotten all the items
		list.forEach( function (item, index){
		  console.log(index) // log which item it is
		  console.log(item.id);
		  console.log(item.name);
		  console.log(item.image);
		  console.log(item.price);
		});
	}
});
```
