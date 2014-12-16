### Examples

```
WinConfig.init({
	type		: windowType,	// default=WinConfig.WindowType.CUSTOM (read WinConfig.WindowType for details)
	title		: "",			// default=based on 'type' if ommited
	name		: "",			// default=based on 'title' if ommited
	description	: "",			// default=empty
	position	: [left, top],	// default=[-1,-1] (CENTERED)
	size		: ["width", "height"]	// default=["280px", 0] (height=0:automatic)
	store		: false,		// default=false except for type=WinConfig.WindowType.CUSTOM
	fields		: [{			// list of fields (default=depends on the 'type')
		label	: "",			// label of the field
		type	: fieldType,	// default=WinConfig.FieldFormat.TEXT (read WinConfig.FieldType for details)
		format	: formatField,	// default=WinConfig.FieldFormat.STRING (read WinConfig.FieldFormat for details)
		name	: "",			// REQUIRED (name of the field)
		value	: "",			// possible values (may be an array depending on the type)
		class	: "",			// default="default" (style class)
		multiple: false,		// default=false (accepts multiple values)
		unique	: false,		// default=false (generates single value)
		default	: "",			// default value
		nogroup	: false,		// removes from the group of fields
		fields	: [...],		// list of fields (only if the current field is a group)
	}],
	condition	: function (cfg) {
		return N;	// -1=OPEN_DIALOG 0=ERROR (call 'unload' without opening dialog) 1=SUCCESS (call 'load' without opening dialog)
	},
	load		: function (cfg) {	// OK Button
		// ... cfg.group1.fieldName1
	},
	unload		: function () {		// Cancel Button
		// ...
	},
});
```

**Minimum examples**
```
PROMPT
WinConfig.init({
	type	: WinConfig.WindowType.PROMPT,	// title="Prompt Dialog" buttons=OK, CANCEL
	description	: "Type something",
	load	: function (cfg) {
		console.log(cfg.text);
	}
});

QUESTION
WinConfig.init({
	type	: WinConfig.WindowType.QUESTION,	// title="Question Dialog" / buttons=YES, NO
	description	: "Are you sure you want to proceed?",
	load	: function (cfg) {
		console.log("YES");
	},
	unload	: function () {
		console.log("NO");
	}
});

WARNING, ERROR, SUCCESS, EXPLANATION (varies default styles)
WinConfig.init({
	type	: WinConfig.WindowType.WARNING,	// title="Warning Dialog" / buttons=OK
	description	: "Something has happened!",
	load	: function (cfg) {
		console.log("OK");
	}
});

CUSTOM
WinConfig.init({
	type	: WinConfig.WindowType.CUSTOM,	// title="Settings" / buttons=SAVE, RESET, CANCEL
	load	: function (cfg) {
		console.log("OK");
	}
});
```
