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
└── wiki/
    ├── tiddlywiki.info        # Wiki configuration
    └── tiddlers/              # System tiddlers + dynamic-store shim pointing at vault/
```

The vault is declared as a TiddlyWiki *dynamic store*. The server loads it at boot and watches it live via chokidar — external edits (from your coding agent, another editor, or `git pull`) are picked up automatically and reflected in the browser. Tiddlers edited in the browser are written back to the vault as Markdown files.

The LLM works on the vault directly using normal file tools (read/write/edit). There is no agent-specific server component.

## Prerequisites

- **Node.js 22** or later

TiddlyWiki is pulled in as an npm dependency from the [`bidirectional-filesystem` branch](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806), which carries the load-bearing pieces for twillm: live filesystem watching (`dynamicStore` in `tiddlywiki.files`) and the YAML frontmatter deserializer/serializer in the Markdown plugin. The standard `tiddlywiki` npm release will not work.

## Setup

```bash
git clone https://github.com/Jermolene/twillm.git
cd twillm
npm install
```

To pull the latest commits from the TiddlyWiki branch later:

```bash
npm update tiddlywiki
```

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

### Working with an LLM

Point your coding agent (Claude Code, Cursor, etc.) at this directory. It edits the `.md` files in `vault/` directly. TiddlyWiki's watcher sees the changes and updates the browser without a reload.

#### Conventions for your agent

Most of what your agent needs to know — Markdown, YAML frontmatter, `[[wiki links]]`, where vault files live — it already knows from generic Markdown/Obsidian conventions. There are a few twillm-specific points you may want to add to your agent instructions (`CLAUDE.md`, `.cursorrules`, etc.):

```markdown
## Notes for editing this vault

- The wiki at http://localhost:8080 (when running) reflects vault edits live via filesystem watching.
- Frontmatter `title` wins over filename when they differ; keep them in sync where you can.
- Don't include `created`, `modified`, or `type` in frontmatter — TiddlyWiki manages timestamps,
  and `.md` extension implies the type. They'll round-trip out anyway.
- List fields (`tags`, `list`) should be YAML arrays: `tags: [concept, multi word tag]`.
- For TiddlyWiki UI tiddlers (wikitext, macros, dashboards) use `.tid` instead of `.md`.
- Don't write to any wiki/ directory if one exists; that's TiddlyWiki's working area.
```

(twillm itself does not write any agent-instruction files into your repo.)

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

## Status

Early development. See [handoff.md](handoff.md) for the full TODO list and design decisions.

## Credits

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — LLM Wiki pattern
