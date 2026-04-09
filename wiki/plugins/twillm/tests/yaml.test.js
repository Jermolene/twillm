#!/usr/bin/env node
/*
Quick test for the minimal YAML parser.
Run: node yaml.test.js
*/
"use strict";

// Load without TiddlyWiki module system
var fs = require("fs");
var src = fs.readFileSync(__dirname + "/../yaml.js", "utf8");
// Strip TiddlyWiki header comment
src = src.replace(/^\/\*\\[\s\S]*?\\\*\/\s*/, "");
var mod = {exports: {}};
var fn = new Function("exports", "module", "require", src);
fn(mod.exports, mod, require);
var yaml = mod.exports;

var passed = 0, failed = 0;

function assert(name, actual, expected) {
	var a = JSON.stringify(actual),
		e = JSON.stringify(expected);
	if(a === e) {
		passed++;
	} else {
		failed++;
		console.error("FAIL: " + name);
		console.error("  expected: " + e);
		console.error("  actual:   " + a);
	}
}

// -- Scalars --
assert("null string", yaml.load("null"), null);
assert("tilde null", yaml.load("~"), null);
assert("empty string", yaml.load(""), null);
assert("true", yaml.load("true"), true);
assert("True", yaml.load("True"), true);
assert("false", yaml.load("false"), false);
assert("integer", yaml.load("42"), 42);
assert("negative int", yaml.load("-7"), -7);
assert("float", yaml.load("3.14"), 3.14);
assert("scientific", yaml.load("1e10"), 1e10);
assert("hex", yaml.load("0xFF"), 255);
assert("octal", yaml.load("0o17"), 15);
assert("inf", yaml.load(".inf"), Infinity);
assert("neg inf", yaml.load("-.inf"), -Infinity);
assert("double quoted", yaml.load('"hello world"'), "hello world");
assert("single quoted", yaml.load("'hello world'"), "hello world");
assert("escape sequences", yaml.load('"line1\\nline2"'), "line1\nline2");
assert("plain string", yaml.load("hello"), "hello");

// -- Flow sequences --
assert("flow array", yaml.load("[a, b, c]"), ["a", "b", "c"]);
assert("flow array nums", yaml.load("[1, 2, 3]"), [1, 2, 3]);
assert("flow array mixed", yaml.load('[1, "two", true, null]'), [1, "two", true, null]);
assert("empty flow array", yaml.load("[]"), []);
assert("flow array with spaces", yaml.load('["multi word", simple]'), ["multi word", "simple"]);

// -- Flow mappings --
assert("flow mapping", yaml.load("{a: 1, b: 2}"), {a: 1, b: 2});
assert("empty flow mapping", yaml.load("{}"), {});

// -- Block mappings (frontmatter-style) --
assert("simple mapping", yaml.load("title: Hello\ntags: foo bar\nrating: 6"), {
	title: "Hello",
	tags: "foo bar",
	rating: 6
});

assert("mapping with flow array", yaml.load("title: Test\ntags: [concept, synthesis, multi word tag]"), {
	title: "Test",
	tags: ["concept", "synthesis", "multi word tag"]
});

assert("mapping with quoted value", yaml.load('title: "A: Subtitle"'), {
	title: "A: Subtitle"
});

assert("mapping with null value", yaml.load("title: Test\ndescription:"), {
	title: "Test",
	description: null
});

// -- Block sequences --
assert("block sequence", yaml.load("- alpha\n- beta\n- gamma"), ["alpha", "beta", "gamma"]);
assert("block sequence mixed", yaml.load("- 1\n- two\n- true"), [1, "two", true]);

// -- Nested block mapping --
assert("nested mapping", yaml.load("outer:\n  inner: value\n  count: 3"), {
	outer: {inner: "value", count: 3}
});

// -- Mapping with block sequence value --
assert("mapping with block seq", yaml.load("title: Test\ntags:\n  - concept\n  - synthesis\n  - multi word tag"), {
	title: "Test",
	tags: ["concept", "synthesis", "multi word tag"]
});

// -- Comments --
assert("comments ignored", yaml.load("# comment\ntitle: Test\n# another comment\nrating: 5"), {
	title: "Test",
	rating: 5
});

// -- Typical frontmatter --
assert("typical frontmatter", yaml.load(
	"title: Some Concept\n" +
	"tags: [concept, synthesis]\n" +
	"created: 2026-04-09\n" +
	"rating: 6"
), {
	title: "Some Concept",
	tags: ["concept", "synthesis"],
	created: "2026-04-09",
	rating: 6
});

// -- dump() --
assert("dump simple", yaml.dump({title: "Hello", rating: 6}).trim(),
	"title: Hello\nrating: 6");

assert("dump array", yaml.dump({tags: ["a", "b"]}).trim(),
	"tags:\n  - a\n  - b");

assert("dump null", yaml.dump({x: null}).trim(), "x: null");
assert("dump bool", yaml.dump({x: true, y: false}).trim(), "x: true\ny: false");
assert("dump empty obj", yaml.dump({}).trim(), "{}");
assert("dump empty arr", yaml.dump({x: []}).trim(), "x: []");

// -- YAMLException --
var threw = false;
try { yaml.load(123); } catch(e) { threw = e instanceof yaml.YAMLException; }
assert("YAMLException on non-string", threw, true);

// -- Summary --
console.log("\n" + passed + " passed, " + failed + " failed");
if(failed > 0) {
	process.exit(1);
}
