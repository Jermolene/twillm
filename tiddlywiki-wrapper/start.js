#!/usr/bin/env node

/*
Custom TiddlyWiki boot script for twillm.

Registers the YAML frontmatter deserializer before TiddlyWiki boots,
so that .md files in the tiddlers directory have their frontmatter
extracted into tiddler fields during the initial file scan.

This is a temporary workaround until the deserializer is merged into
TiddlyWiki core.
*/

"use strict";

// Resolve tiddlywiki from local node_modules, falling back to global install
var twPath;
try {
	twPath = require.resolve("tiddlywiki");
} catch(e) {
	var cp = require("child_process");
	var globalRoot = cp.execSync("npm root -g", {encoding: "utf8"}).trim();
	twPath = require("path").join(globalRoot, "tiddlywiki");
}
var $tw = require(twPath).TiddlyWiki();

// Build the deserializer with $tw bound and register it as a module so the
// boot kernel picks it up via applyMethods("tiddlerdeserializer", ...)
var deserializer = require("./markdown-deserializer.js")($tw);
$tw.modules.define("$:/twillm/markdown-deserializer.js", "tiddlerdeserializer", deserializer);

// Pass command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv, 2);

// Boot TiddlyWiki
$tw.boot.boot();
