# TWILLM

A TiddlyWiki-based LLM knowledge wiki, inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM maintains a vault of Markdown files; TiddlyWiki serves them to the human in a browser and picks up changes live.

## Why TiddlyWiki instead of Obsidian

<!-- Jeremy to rewrite in own voice -->

- **Computed views, not stored files** — TiddlyWiki views are live filter expressions, not materialised Markdown files. Nothing goes stale. The LLM creates content, not index files.
- **Queryable fields** — YAML frontmatter is extracted into native tiddler fields (tags, ratings, custom metadata), all searchable via filters.
- **LLM-authored UI** — wikitext tiddlers are live views and mini-apps. The LLM can program the wiki, not just populate it.
- **Free and open** — no paid tier, no vendor lock-in.

## Architecture

```
twillm/
├── vault/                     # Markdown files with YAML frontmatter — the source of truth
├── wiki/
│   ├── tiddlywiki.info        # Wiki configuration
│   └── tiddlers/              # System tiddlers + dynamic-store shim pointing at vault/
└── tiddlywiki-wrapper/        # Custom boot (temporary, see below)
    ├── start.js               # CLI entry point
    ├── markdown-deserializer.js
    └── yaml.js
```

The vault is declared as a TiddlyWiki *dynamic store*. The server loads it at boot and watches it live via chokidar — external edits (from your coding agent, another editor, or `git pull`) are picked up automatically and reflected in the browser. Tiddlers edited in the browser are written back to the vault as Markdown files.

The LLM works on the vault directly using normal file tools (read/write/edit). There is no agent-specific server component.

## Prerequisites

- **Node.js 22** or later
- **TiddlyWiki** built from the [`bidirectional-filesystem` branch](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806), globally linked. This branch adds live filesystem watching (`dynamicStore` in `tiddlywiki.files`), which is load-bearing for the sync story — the standard `tiddlywiki` npm release will not work.

## Setup

```bash
# Build and link the required TiddlyWiki branch
git clone -b bidirectional-filesystem https://github.com/TiddlyWiki/TiddlyWiki5.git
cd TiddlyWiki5
npm install
npm link
cd ..

# Clone and use twillm
git clone https://github.com/Jermolene/twillm.git
cd twillm
```

No `npm install` is needed in the twillm directory — the project has no npm dependencies of its own. TiddlyWiki is resolved from your global link.

## Usage

### Start the wiki server

```bash
npm start
```

Open `http://localhost:8080` in a browser. The vault is loaded automatically and watched live.

### Build static HTML

```bash
npm run build
```

Renders all Markdown tiddlers in the vault as static HTML files in `wiki/output/`.

### Run tests

```bash
npm test
```

### Working with an LLM

Point your coding agent (Claude Code, Cursor, etc.) at this directory. It edits the `.md` files in `vault/` directly. TiddlyWiki's watcher sees the changes and updates the browser without a reload.

## Tiddler format

Markdown files with YAML frontmatter:

```markdown
---
title: Some Concept
tags: [concept, synthesis]
rating: 6
---

Body in Markdown. Wiki links: [[Other Tiddler]]
```

The YAML frontmatter is extracted into native TiddlyWiki fields:
- **Arrays** on list fields (tags, list) become TiddlyWiki bracketed lists
- **Strings** are stored as-is
- **Other types** (objects, booleans) are stored as JSON

## Tiddlywiki-wrapper

The `tiddlywiki-wrapper/` directory contains a thin shim around the `tiddlywiki` CLI. It exists because TiddlyWiki's boot sequence registers deserializer modules *after* loading wiki files from disk, so a plugin-provided deserializer can't process `.md` files at boot time. The wrapper registers the YAML frontmatter deserializer before booting TW.

This is temporary. It will be removed once the deserializer is merged into TiddlyWiki core. See [tiddlywiki-wrapper/README.md](tiddlywiki-wrapper/README.md) for details.

## Status

Early development. See [handoff.md](handoff.md) for the full TODO list and design decisions.

## Credits

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — LLM Wiki pattern
