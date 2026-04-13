# TWILLM — Claude Code handoff

## What this is

A TiddlyWiki-based variant of [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM edits Markdown files in `vault/` directly (using normal file tools). TiddlyWiki runs as a Node.js server, loads the vault as a live-watched *dynamic store*, and serves the wiki to a browser at `http://localhost:8080`.

## Repo structure

```
./
├── handoff.md                  # This file — working brief
├── CLAUDE.md                   # LLM schema (TODO)
├── README.md                   # End-user docs
├── package.json                # npm scripts (test, start, build)
├── .gitignore
├── vault/                      # Markdown files with YAML frontmatter — the LLM's working directory
└── wiki/                       # TiddlyWiki wiki folder
    ├── tiddlywiki.info
    └── tiddlers/
        ├── $__SiteTitle.tid
        ├── $__SiteSubtitle.tid
        └── vault-loader/
            └── tiddlywiki.files  # Declares ../../../vault as a dynamic store
```

Plus `tiddlywiki-wrapper/` — a temporary shim (see that directory's README).

## Tech stack

- **TiddlyWiki** on the `bidirectional-filesystem` branch (PR [#9806](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806)). This adds `dynamicStore` support to `tiddlywiki.files` — filesystem watching via chokidar. **Load-bearing.**
- **`tiddlywiki/markdown`** plugin — renders `.md` tiddler content (body only, not frontmatter)
- **`tiddlywiki/tiddlyweb`** plugin — HTTP server for the browser
- **Custom YAML frontmatter deserializer** in `tiddlywiki-wrapper/` — extracts frontmatter into tiddler fields at boot
- **Node.js 22**

## Architecture rationale

This is the third architecture we tried. The first two failed:

1. **MCP server (wikilabs/tw-mcp) with proxy/takeover** — intended to share one `$tw.wiki` between the HTTP server and the LLM's stdio client. In practice the proxy/takeover didn't fire reliably: the LLM and browser ended up with isolated stores, so LLM writes never appeared in the browser until a restart. Additionally, the MCP plugin's `persistTiddler` hardcodes `$tw.boot.wikiTiddlersPath` as the save directory, ignoring `$tw.boot.dynamicStores`. Would need upstream fixes to be viable.

2. **Copy sample-vault into `wiki/content/` + dynamic store + MCP** — awkward duplication of files, and still carried the MCP saveFilter bug above.

3. **Current: LLM edits `vault/` directly via file tools; TW watches it** — simplest possible. Matches Karpathy's Obsidian model (filesystem is source of truth, watcher picks up changes). No MCP server, no process coordination, no duplication.

## YAML frontmatter deserializer

In `tiddlywiki-wrapper/`. Converts Markdown frontmatter into tiddler fields at boot time:

- **Arrays on list fields** (tags, list) → `$tw.utils.stringifyList()`: `[concept, multi word tag]` → `concept [[multi word tag]]`
- **Strings** → as-is
- **Non-string/array values** (objects, booleans) → `JSON.stringify()`
- **Numbers** → `String()`

Field collision policy:
- `title` — frontmatter wins over filename
- `tags` — merged with any existing tags
- `created`/`modified` — ignored (defer to TW timestamps)
- `type` — frontmatter wins

Lives outside the wiki folder (as a plain Node module, not a TW plugin) because TiddlyWiki registers `tiddlerdeserializer` modules *after* loading wiki files from disk. The wrapper registers ours pre-boot via `$tw.modules.define()`. Temporary; planned for upstream merge into the Markdown plugin.

42 unit tests in `tiddlywiki-wrapper/tests/` (minimal YAML parser).

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
- [x] Markdown YAML frontmatter deserializer. Lives in `tiddlywiki-wrapper/`.
- [x] TiddlyWiki server config with live sync via dynamic store.
- [ ] **CLAUDE.md** — workflow guidance for the LLM. Topics: how to add a new tiddler (create a `.md` in `vault/`), field conventions (title, tags, rating), Markdown vs wikitext policy, when to use `.tid` vs `.md`, linking (wiki-style `[[Target]]` links work in TW).
- [ ] **tw5-graph** plugin — [https://github.com/flibbles/tw5-graph](https://github.com/flibbles/tw5-graph). Graph view of tiddlers and their links. Requires vis-network. Low star count (~30), may have rough edges — note any issues in smoke testing.
- [ ] **"Why TiddlyWiki" section** in README — Jeremy to rewrite in own voice.
- [ ] **Upstream PRs** — (a) merge YAML frontmatter deserializer into `tiddlywiki/markdown` plugin, so we can delete `tiddlywiki-wrapper/`; (b) if we ever want MCP back, PR to wikilabs/tw-mcp fixing `persistTiddler` to respect `$tw.boot.dynamicStores`.

## Risks to flag

- `bidirectional-filesystem` is unmerged. If it changes shape before merging, `tiddlywiki.files` config may need updating.
- LLM wikitext generation will be noisier than Markdown; keep the default policy Markdown-only when CLAUDE.md is drafted.
- tw5-graph has ~30 stars and may be rough.

## Working conventions

- Commit each logical unit of work separately with descriptive messages.
- If a TODO turns out to be more complex than expected, open a new TODO rather than shipping something incomplete.
- Prefer `TODO:` comments in code over silent gaps.
- The LLM edits files in `vault/` directly. No MCP. No copying/seeding.
