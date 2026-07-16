#!/usr/bin/env node

/*
Smoke test for twillm. Exercises cli.js end-to-end in a temp directory and
asserts the contracts documented in README.md:

- twillm-wiki/ is materialised on first run with a relative vault-loader path
- files already present in twillm-wiki/ are never overwritten on later runs;
  files newly added to the template still propagate (issue #1)
- .DS_Store is never copied into twillm-wiki/
- headless commands (--version, --render) terminate by themselves
- -h/-v are answered by twillm before the -- separator and passed through
  to TiddlyWiki after it

No framework; exits non-zero on the first failure.
*/

"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const cp = require("child_process");

const repoDir = path.resolve(__dirname, "..");
const cliPath = path.join(repoDir, "cli.js");
const pkg = require(path.join(repoDir, "package.json"));

const RUN_TIMEOUT = 120000;

let failures = 0;

function check(label, ok, detail) {
	if(ok) {
		process.stdout.write("ok   " + label + "\n");
	} else {
		failures++;
		process.stdout.write("FAIL " + label + (detail ? " — " + detail : "") + "\n");
	}
}

/*
Run cli.js with the given args and cwd. Resolves {code, out, timedOut}.
cli.js spawns TiddlyWiki as a child, so the whole process group is killed
on timeout to avoid orphans.
*/
function runCli(args, cwd) {
	return new Promise(function(resolve) {
		const child = cp.spawn(process.execPath, [cliPath].concat(args), {
			cwd: cwd,
			stdio: ["ignore", "pipe", "pipe"],
			detached: true
		});
		let out = "";
		child.stdout.on("data", function(d) { out += d; });
		child.stderr.on("data", function(d) { out += d; });
		const timer = setTimeout(function() {
			try { process.kill(-child.pid, "SIGKILL"); } catch(e) {}
			resolve({code: null, out: out, timedOut: true});
		}, RUN_TIMEOUT);
		child.on("exit", function(code) {
			clearTimeout(timer);
			resolve({code: code, out: out, timedOut: false});
		});
	});
}

function findFiles(dir, name) {
	let results = [];
	for(const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		const p = path.join(dir, entry.name);
		if(entry.isDirectory()) {
			results = results.concat(findFiles(p, name));
		} else if(entry.name === name) {
			results.push(p);
		}
	}
	return results;
}

async function main() {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "twillm-smoke-"));
	process.stdout.write("smoke test working directory: " + tmpDir + "\n");
	fs.cpSync(path.join(repoDir, "vault"), path.join(tmpDir, "vault"), {recursive: true});
	const wikiDir = path.join(tmpDir, "twillm-wiki");

	// --- twillm's own flags ---
	const version = await runCli(["-v"], tmpDir);
	check("twillm -v prints package version", version.out.trim() === pkg.version, JSON.stringify(version.out.trim()));
	const noVault = await runCli([], fs.mkdtempSync(path.join(os.tmpdir(), "twillm-novault-")));
	check("no vault -> non-zero exit with message", noVault.code === 1 && /no vault found/.test(noVault.out));

	// --- first run: materialisation, version passthrough, headless exit ---
	const run1 = await runCli(["--", "--version"], tmpDir);
	check("headless --version run exits by itself", !run1.timedOut && run1.code === 0, run1.timedOut ? "still running after " + RUN_TIMEOUT + "ms" : "exit " + run1.code);
	check("-- --version reaches TiddlyWiki", /^5\.\d+\.\d+/m.test(run1.out), JSON.stringify(run1.out.slice(0, 200)));
	check("twillm-wiki/ materialised", fs.existsSync(path.join(wikiDir, "tiddlywiki.info")));
	check("no .DS_Store copied into twillm-wiki/", fs.existsSync(wikiDir) && findFiles(wikiDir, ".DS_Store").length === 0);
	const loaderPath = path.join(wikiDir, "tiddlers", "vault-loader", "tiddlywiki.files");
	const loader = fs.existsSync(loaderPath) ? JSON.parse(fs.readFileSync(loaderPath, "utf8")) : null;
	check("vault-loader uses a relative path", !!loader && !path.isAbsolute(loader.directories[0].path), loader && loader.directories[0].path);

	// --- user edits to shipped files must survive a rerun (issue #1) ---
	const infoPath = path.join(wikiDir, "tiddlywiki.info");
	const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
	info.plugins.push("tiddlywiki/katex");
	fs.writeFileSync(infoPath, JSON.stringify(info, null, "\t"));
	const titlePath = path.join(wikiDir, "tiddlers", "$__SiteTitle.tid");
	fs.writeFileSync(titlePath, "title: $:/SiteTitle\n\nSmoke Test Title\n");
	const graphsPath = path.join(wikiDir, "tiddlers", "Graphs.tid");
	fs.rmSync(graphsPath);

	const run2 = await runCli(["--", "--version"], tmpDir);
	check("second run exits by itself", !run2.timedOut && run2.code === 0);
	const info2 = JSON.parse(fs.readFileSync(infoPath, "utf8"));
	check("user edit to tiddlywiki.info survives rerun", info2.plugins.indexOf("tiddlywiki/katex") !== -1);
	check("user edit to shipped tiddler survives rerun", /Smoke Test Title/.test(fs.readFileSync(titlePath, "utf8")));
	check("deleted template file is restored (new-file propagation)", fs.existsSync(graphsPath));

	// --- headless render terminates and produces output ---
	const run3 = await runCli([
		"--",
		"--render", "[type[text/x-markdown]]",
		"[encodeuricomponent[]addsuffix[.html]]",
		"text/plain", "$:/core/templates/static.tiddler.html"
	], tmpDir);
	check("--render run exits by itself", !run3.timedOut && run3.code === 0, run3.timedOut ? "still running after " + RUN_TIMEOUT + "ms" : "exit " + run3.code);
	const outputDir = path.join(wikiDir, "output");
	const htmlFiles = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter(function(f) { return /\.html$/.test(f); }) : [];
	check("--render produced HTML output", htmlFiles.length > 0, outputDir);

	fs.rmSync(tmpDir, {recursive: true, force: true});
	process.stdout.write(failures === 0 ? "\nAll smoke tests passed\n" : "\n" + failures + " smoke test(s) FAILED\n");
	process.exit(failures === 0 ? 0 : 1);
}

main().catch(function(err) {
	process.stderr.write("smoke test crashed: " + (err && err.stack || err) + "\n");
	process.exit(1);
});
