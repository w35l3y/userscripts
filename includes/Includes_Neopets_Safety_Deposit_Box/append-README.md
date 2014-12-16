### Examples

**SDB.convert**
```
At http://www.neopets.com/safetydeposit.phtml
console.log(SDB.convert(document));

Returns an object similar to this: (I will call 'SDBObject')
{
	current	: N,	// current page (Number)
	last	: N,	// last page (Number)
	error	: 0|1,	// 0=success 1=error
	message	: "",	// error message
	list	: [{	// list of items
		Id			: "id1",
		Name		: "name1",
		Image		: "image1",
		Description	: "desc1",
		Type		: "type1",
		Quantity	: N		// total of the item 'id1' (Number)
	}],
}
```

**SDB.list**
```
SDB.list({
	name		: "...",	// search for "..."
	category	: N,		// id of the category
	page		: N,		// ignored if 'offset' is present
	offset		: N,		// pagination (page 0=0, page 1=30, page N=30*N) - consider using 'page'
	onsuccess	: function (obj) {
		// obj is a 'SDBObject'
	}
});
```

**SDB.remove**
```
SDB.remove({
	// You may also add: name, category, offset, page (read SDB.list for details)
	pin			: "...",	// only if necessary
	items		: [["id1", "qnty1"], ["id2", "qnty2"], ["idN", "qntyN"]],
	onsuccess	: function (obj) {
		// obj is a 'SDBObject'
	}
});
```

**SDB.removeOne**<br />
This is a shortcut to `SDB.remove`, read `SDB.remove` for details
```
SDB.removeOne({
	pin			: "...",	// only if necessary
	id			: "id1",	// id of the item
	onsuccess	: function (obj) {
		// obj is a 'SDBObject'
	}
});
```
