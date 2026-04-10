# tiddlywiki-wrapper

A thin wrapper around the `tiddlywiki` CLI that pre-registers extra
tiddler deserializers before TiddlyWiki boots.

## Why this exists

TiddlyWiki's boot sequence loads wiki files from disk *before* registering
tiddler deserializer modules from plugins. This means a deserializer
defined in a plugin folder is only available *after* the initial file
scan, so `.md` files in `wiki/tiddlers/` cannot have their YAML frontmatter
extracted into tiddler fields at boot time.

This wrapper sidesteps the problem by registering the YAML frontmatter
deserializer directly via `$tw.modules.define()` *before* calling
`$tw.boot.boot()`. The deserializer is then available when wiki files
are loaded.

## What's in here

- `start.js` — CLI entry point. Resolves the `tiddlywiki` package (local
  or global), registers the deserializer, then boots TW with the
  command-line arguments passed through.
- `markdown-deserializer.js` — Markdown + YAML frontmatter deserializer
  factory. Takes a `$tw` object, returns a deserializer hashmap.
- `yaml.js` — Minimal YAML parser, API-compatible with the `js-yaml`
  subset needed for frontmatter (`load`, `dump`, `YAMLException`).
- `tests/` — Standalone Node tests for the YAML parser.

## Usage

From the project root:

```
node tiddlywiki-wrapper/start.js wiki [tiddlywiki args...]
```

The `npm run build` script wraps this.

## Temporary status

This wrapper is a stopgap. The end state is two upstream PRs:

1. **TiddlyWiki core** — change boot ordering so `tiddlerdeserializer`
   modules from plugins are registered before wiki files are loaded,
   *or* allow specific deserializers to be registered earlier in the
   boot sequence.
2. **TiddlyWiki Markdown plugin** — merge the YAML frontmatter
   deserializer into the official Markdown plugin.

Once both land, `tiddlywiki-wrapper/` can be deleted and the project
will use the `tiddlywiki` CLI directly.
