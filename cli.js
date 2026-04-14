#!/usr/bin/env node

/*
twillm CLI.

Detects the user's Markdown vault, materialises a TiddlyWiki working
directory at .twillm-wiki/ in the cwd (idempotent), points it at the
vault as a dynamic store, and starts the TW server.

Usage:
    twillm [vault-path] [-- ...tiddlywiki args]

If no vault-path is given, looks for: ./vault, ./notes, ./content,
or treats the cwd as the vault if .obsidian/ is present.
*/

"use strict";

var path = require("path");
var fs = require("fs");
var cp = require("child_process");

// --- Vault detection ---

function detectVault(arg) {
	if(arg) {
		return path.resolve(arg);
	}
	for(var name of ["vault","notes","content"]) {
		var candidate = path.resolve(process.cwd(),name);
		if(fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
			return candidate;
		}
	}
	if(fs.existsSync(path.resolve(process.cwd(),".obsidian"))) {
		return process.cwd();
	}
	return null;
}

// --- Template materialisation ---

function copyDir(src,dest) {
	fs.mkdirSync(dest,{recursive: true});
	for(var entry of fs.readdirSync(src,{withFileTypes: true})) {
		var s = path.join(src,entry.name);
		var d = path.join(dest,entry.name);
		if(entry.isDirectory()) {
			copyDir(s,d);
		} else {
			fs.copyFileSync(s,d);
		}
	}
}

function materialiseWiki(wikiDir,templateDir) {
	if(!fs.existsSync(wikiDir)) {
		copyDir(templateDir,wikiDir);
	}
}

function writeVaultLoader(wikiDir,vaultPath) {
	var loaderDir = path.join(wikiDir,"tiddlers","vault-loader");
	fs.mkdirSync(loaderDir,{recursive: true});
	var spec = {
		directories: [{
			path: vaultPath,
			filesRegExp: "^.*\\.(md|tid)$",
			isTiddlerFile: true,
			searchSubdirectories: true,
			dynamicStore: {
				saveFilter: "[!is[system]]",
				watch: true,
				debounce: 400
			},
			fields: {}
		}]
	};
	fs.writeFileSync(
		path.join(loaderDir,"tiddlywiki.files"),
		JSON.stringify(spec,null,"\t") + "\n"
	);
}

// --- Main ---

var argv = process.argv.slice(2);
var vaultArg = null;
var passthrough = [];
var seenSeparator = false;
for(var arg of argv) {
	if(arg === "--") {
		seenSeparator = true;
		continue;
	}
	if(seenSeparator) {
		passthrough.push(arg);
	} else if(!vaultArg && arg.charAt(0) !== "-") {
		vaultArg = arg;
	} else {
		passthrough.push(arg);
	}
}

var vaultPath = detectVault(vaultArg);
if(!vaultPath || !fs.existsSync(vaultPath)) {
	console.error("twillm: no vault found.");
	console.error("Pass a vault path, or run from a directory containing vault/, notes/, content/, or .obsidian/.");
	process.exit(1);
}
console.error("twillm: serving vault at " + vaultPath);

var packageDir = __dirname;
var templateDir = path.join(packageDir,"template-wiki");
var wikiDir = path.resolve(process.cwd(),".twillm-wiki");

materialiseWiki(wikiDir,templateDir);
writeVaultLoader(wikiDir,vaultPath);

var twBin = require.resolve("tiddlywiki/tiddlywiki.js");
// If no TW commands were passed through, default to --listen
var twArgs = passthrough.length > 0 ? passthrough : ["--listen"];
var args = [twBin,wikiDir].concat(twArgs);
var child = cp.spawn(process.execPath,args,{stdio: "inherit"});
child.on("exit",function(code,signal) {
	process.exit(signal ? 1 : (code || 0));
});
