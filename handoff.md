# TWILLM — Claude Code handoff

## What this is

A TiddlyWiki-based variant of [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM edits Markdown files in `vault/` directly (using normal file tools). TiddlyWiki runs as a Node.js server, loads the vault as a live-watched *dynamic store*, and serves the wiki to a browser at `http://localhost:8080`.

## Repo structure

```
./
├── handoff.md                  # This file — working brief
├── CLAUDE.md                   # Conventions for working on twillm (this repo)
├── README.md                   # End-user docs
├── package.json                # bin: twillm → ./cli.js; deps: tiddlywiki
├── cli.js                      # Entry point: detects vault, materialises wiki, spawns TW
├── .gitignore
├── vault/                      # Test fixture — sample LLM-authored content
└── template-wiki/              # Wiki template materialised into .twillm-wiki/ at run time
    ├── tiddlywiki.info
    └── tiddlers/
        ├── $__SiteTitle.tid
        ├── $__SiteSubtitle.tid
        ├── $__config_SyncPollingInterval.tid
        └── vault-loader/
            └── tiddlywiki.files  # Overwritten at run time with absolute vault path
```

End-user run path:

```
$ cd my-vault-repo
$ npx github:Jermolene/twillm
```

`cli.js` detects the vault, materialises `.twillm-wiki/` (dot-prefixed so Obsidian ignores it), writes the dynamic-store config pointing at the absolute vault path, then spawns `tiddlywiki .twillm-wiki/ --listen`.

## Tech stack

- **TiddlyWiki** pulled in as a git dependency from the `bidirectional-filesystem` branch (PR [#9806](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806)). `npm install` fetches it; `npm update tiddlywiki` re-pulls. This branch carries the load-bearing pieces:
  - `dynamicStore` support in `tiddlywiki.files` — chokidar-based filesystem watching
  - YAML frontmatter deserializer + serializer in `plugins/tiddlywiki/markdown/`
  - Boot-ordering fix so plugin-provided deserializers are available when wiki tiddler files load
  - `tiddlerserializer` module type for round-tripping non-`text/vnd.tiddlywiki` tiddlers as single files (no `.meta` sidecar)
- **`tiddlywiki/markdown`** plugin — renders `.md` tiddler bodies, extracts YAML frontmatter at boot, and writes it back on save
- **`tiddlywiki/tiddlyweb`** plugin — HTTP server for the browser
- **`tiddlywiki/filesystem`** plugin — filesystem syncadaptor with dynamic store watcher
- **Node.js 22**

## Architecture rationale

This is the third architecture we tried. The first two failed:

1. **MCP server (wikilabs/tw-mcp) with proxy/takeover** — intended to share one `$tw.wiki` between the HTTP server and the LLM's stdio client. In practice the proxy/takeover didn't fire reliably: the LLM and browser ended up with isolated stores, so LLM writes never appeared in the browser until a restart. Additionally, the MCP plugin's `persistTiddler` hardcodes `$tw.boot.wikiTiddlersPath` as the save directory, ignoring `$tw.boot.dynamicStores`. Would need upstream fixes to be viable.

2. **Copy sample-vault into `wiki/content/` + dynamic store + MCP** — awkward duplication of files, and still carried the MCP saveFilter bug above.

3. **Current: LLM edits `vault/` directly via file tools; TW watches it** — simplest possible. Matches Karpathy's Obsidian model (filesystem is source of truth, watcher picks up changes). No MCP server, no process coordination, no duplication.

## YAML frontmatter (deserializer + serializer)

Both live in TiddlyWiki's `plugins/tiddlywiki/markdown/` (in the `bidirectional-filesystem` branch):
- `frontmatter-deserializer.js` (module-type: tiddlerdeserializer for `text/x-markdown`)
- `frontmatter-serializer.js` (module-type: tiddlerserializer for `text/x-markdown`)
- `yaml.js` (minimal js-yaml-API-compatible parser; library module)

Round-trip:
- **Load**: `---` YAML frontmatter → tiddler fields. Arrays on list fields (tags, list) → TW bracketed lists. Other non-string values → JSON. `created`/`modified` ignored. Existing tags merged with frontmatter tags.
- **Save**: tiddler fields → YAML frontmatter, body → after the closing `---`. `text`/`created`/`modified`/`bag`/`revision` skipped from frontmatter. `type: text/x-markdown` omitted (default for `.md`). List fields → YAML arrays. Title emitted first.

Tests in `editions/test/tiddlers/tests/test-markdown-frontmatter.js` (covers parser, deserializer, serializer, and round-trip).

## Dynamic store config

`wiki/tiddlers/vault-loader/tiddlywiki.files`:

```json
{
  "directories": [
    {
      "path": "../../../vault",
      "filesRegExp": "^.*\\.(md|tid)$",
      "isTiddlerFile": true,
      "searchSubdirectories": true,
      "dynamicStore": {
        "saveFilter": "[!is[system]]",
        "watch": true,
        "debounce": 400
      },
      "fields": {}
    }
  ]
}
```

`saveFilter: [!is[system]]` routes all non-system tiddler saves to `vault/`.

## TODOs — ordered by priority

- [x] Audit TW MCP server (wikilabs/tw-mcp). Toolset comprehensive but proxy/takeover unreliable; plugin has saveFilter bug. **Dropped.**
- [x] Markdown YAML frontmatter deserializer. Now part of the `tiddlywiki/markdown` plugin upstream.
- [x] Markdown YAML frontmatter serializer. Same.
- [x] Boot-ordering fix so plugin deserializers are available at file-load time.
- [x] TiddlyWiki server config with live sync via dynamic store.
- [ ] **CLAUDE.md** — workflow guidance for the LLM. Topics: how to add a new tiddler (create a `.md` in `vault/`), field conventions (title, tags, rating), Markdown vs wikitext policy, when to use `.tid` vs `.md`, linking (wiki-style `[[Target]]` links work in TW).
- [ ] **tw5-graph** plugin — [https://github.com/flibbles/tw5-graph](https://github.com/flibbles/tw5-graph). Graph view of tiddlers and their links. Requires vis-network. Low star count (~30), may have rough edges — note any issues in smoke testing.
- [ ] **"Why TiddlyWiki" section** in README — Jeremy to rewrite in own voice.
- [ ] **Land `bidirectional-filesystem` upstream** — once PR #9806 merges and a TW release containing it is published, README setup instructions can recommend `npm install -g tiddlywiki` instead of building from source.

## Risks to flag

- `bidirectional-filesystem` is unmerged. If it changes shape before merging, `tiddlywiki.files` config may need updating.
- LLM wikitext generation will be noisier than Markdown; keep the default policy Markdown-only when CLAUDE.md is drafted.
- tw5-graph has ~30 stars and may be rough.

## Working conventions

- Commit each logical unit of work separately with descriptive messages.
- If a TODO turns out to be more complex than expected, open a new TODO rather than shipping something incomplete.
- Prefer `TODO:` comments in code over silent gaps.
- The LLM edits files in `vault/` directly. No MCP. No copying/seeding.
