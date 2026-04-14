#!/usr/bin/env node

/*
twillm CLI.

Detects the user's Markdown vault, materialises a TiddlyWiki working
directory at twillm-wiki/ in the cwd (idempotent, commit-friendly),
points it at the vault as a dynamic store, and starts the TW server.

Usage:
    twillm [vault-path] [-- ...tiddlywiki args]

If no vault-path is given, looks for: ./vault, ./notes, ./content,
or treats the cwd as the vault if .obsidian/ is present.
*/

"use strict";

const path = require("path");
const fs = require("fs");
const cp = require("child_process");

const HELP = `Usage: twillm [vault-path] [-- ...tiddlywiki args]

Materialises a TiddlyWiki working directory (twillm-wiki/) in the
current directory, points it at your Markdown vault as a live-watched
dynamic store, and starts the TiddlyWiki server.

Vault detection (in order):
  1. Explicit vault-path argument
  2. ./vault, ./notes, or ./content in the current directory
  3. The current directory if it contains .obsidian/

By default the server listens on http://localhost:8080. To pass other
TiddlyWiki commands instead of --listen, use -- as a separator:

  twillm vault -- --render '[type[text/x-markdown]]' '[encodeuricomponent[]addsuffix[.html]]' text/plain '$:/core/templates/static.tiddler.html'

Options:
  -h, --help     Show this help and exit
  -v, --version  Show version and exit
`;

// --- Vault detection ---

function detectVault(arg) {
	if(arg) {
		return path.resolve(arg);
	}
	for(const name of ["vault","notes","content"]) {
		const candidate = path.resolve(process.cwd(),name);
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
	for(const entry of fs.readdirSync(src,{withFileTypes: true})) {
		const s = path.join(src,entry.name);
		const d = path.join(dest,entry.name);
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
	const loaderDir = path.join(wikiDir,"tiddlers","vault-loader");
	fs.mkdirSync(loaderDir,{recursive: true});
	// Use a relative path so the file is portable across collaborators.
	// Falls back to absolute if the vault is on a different drive (Windows)
	// and path.relative produces something non-usable.
	const relPath = path.relative(loaderDir,vaultPath);
	const storePath = (relPath && !path.isAbsolute(relPath)) ? relPath : vaultPath;
	const spec = {
		directories: [{
			path: storePath,
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

// --- Argument parsing ---

const argv = process.argv.slice(2);

// Handle --help / --version before anything else
for(const arg of argv) {
	if(arg === "-h" || arg === "--help") {
		process.stdout.write(HELP);
		process.exit(0);
	}
	if(arg === "-v" || arg === "--version") {
		const pkg = require(path.join(__dirname,"package.json"));
		process.stdout.write(pkg.version + "\n");
		process.exit(0);
	}
}

let vaultArg = null;
const passthrough = [];
let seenSeparator = false;
for(const arg of argv) {
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

// --- Main ---

const vaultPath = detectVault(vaultArg);
if(!vaultPath || !fs.existsSync(vaultPath)) {
	process.stderr.write("twillm: no vault found.\n");
	process.stderr.write("Pass a vault path, or run from a directory containing vault/, notes/, content/, or .obsidian/.\n");
	process.stderr.write("Run with --help for usage.\n");
	process.exit(1);
}
process.stderr.write("twillm: serving vault at " + vaultPath + "\n");

const packageDir = __dirname;
const templateDir = path.join(packageDir,"template-wiki");
const wikiDir = path.resolve(process.cwd(),"twillm-wiki");

materialiseWiki(wikiDir,templateDir);
writeVaultLoader(wikiDir,vaultPath);

let twBin;
try {
	twBin = require.resolve("tiddlywiki/tiddlywiki.js");
} catch(e) {
	process.stderr.write("twillm: cannot find tiddlywiki package. Run `npm install` in " + packageDir + ".\n");
	process.exit(1);
}

// If no TW commands were passed through, default to --listen
const twArgs = passthrough.length > 0 ? passthrough : ["--listen"];
const args = [twBin,wikiDir].concat(twArgs);
const child = cp.spawn(process.execPath,args,{stdio: "inherit"});
child.on("exit",function(code,signal) {
	process.exit(signal ? 1 : (code || 0));
});
