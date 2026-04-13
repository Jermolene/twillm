/*
Markdown serializer with YAML frontmatter.

Mirrors markdown-deserializer.js: emits a single .md file with YAML
frontmatter for non-text fields followed by the tiddler body. Used by
the core-server filesystem save path via the `tiddlerserializer` module
type, which dispatches on tiddler content type.

Exported as a factory: pass a $tw object to receive a serializer
hashmap suitable for $tw.modules.define(...).
*/
"use strict";

var yaml = require("./yaml.js");

module.exports = function($tw) {

	// Fields that should never appear in the YAML frontmatter
	var EXCLUDED_FIELDS = {
		text: true,
		bag: true,
		revision: true,
		type: true
	};

	function fieldStringToValue(key, str) {
		// List fields → arrays
		if($tw.Tiddler.fieldModules[key] && $tw.Tiddler.fieldModules[key].stringify) {
			return $tw.utils.parseStringArray(str) || [];
		}
		// JSON-shaped values round-trip as parsed JSON
		if(str && (str.charAt(0) === "{" || str.charAt(0) === "[")) {
			try {
				return JSON.parse(str);
			} catch(e) {
				// Fall through to string
			}
		}
		return str;
	}

	function serialize(tiddler) {
		var fields = tiddler.getFieldStrings(),
			frontmatter = {},
			hasFrontmatter = false,
			keys = Object.keys(fields).sort();
		for(var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if(EXCLUDED_FIELDS[key]) {
				continue;
			}
			frontmatter[key] = fieldStringToValue(key, fields[key]);
			hasFrontmatter = true;
		}
		var body = fields.text || "";
		if(!hasFrontmatter) {
			return body;
		}
		var dumped = yaml.dump(frontmatter);
		if(dumped.charAt(dumped.length - 1) !== "\n") {
			dumped += "\n";
		}
		return "---\n" + dumped + "---\n\n" + body;
	}

	return {
		"text/x-markdown": serialize
	};
};
