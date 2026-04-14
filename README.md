# TWILLM

A TiddlyWiki-based LLM knowledge wiki, inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM maintains a vault of Markdown files; TiddlyWiki serves them to the human in a browser and picks up changes live. Use it alongside Obsidian against the same files.

## Why TiddlyWiki instead of Obsidian

<!-- Jeremy to rewrite in own voice -->

- **Computed views, not stored files** — TiddlyWiki views are live filter expressions, not materialised Markdown files. Nothing goes stale. The LLM creates content, not index files.
- **Queryable fields** — YAML frontmatter is extracted into native tiddler fields (tags, ratings, custom metadata), all searchable via filters.
- **LLM-authored UI** — wikitext tiddlers are live views and mini-apps. The LLM can program the wiki, not just populate it.
- **Free and open** — no paid tier, no vendor lock-in.

## Prerequisites

- **Node.js 22** or later

twillm bundles a TiddlyWiki build from the [`bidirectional-filesystem` branch](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806), which carries the load-bearing pieces: live filesystem watching (`dynamicStore` in `tiddlywiki.files`) and the YAML frontmatter deserializer/serializer in the Markdown plugin. The standard `tiddlywiki` npm release will not work.

## Usage (drop-in to an existing vault)

If you already have a Markdown vault (Obsidian, Karpathy-style, or just a folder of `.md` files):

```bash
cd my-vault-repo
npx github:Jermolene/twillm
```

Open `http://localhost:8080`. Edits in the browser, in Obsidian, and from your coding agent are all picked up live.

twillm auto-detects the vault directory:
1. Explicit argument: `npx github:Jermolene/twillm my-notes/`
2. Otherwise looks for `vault/`, `notes/`, or `content/` in the current directory
3. Falls back to the current directory if it contains an `.obsidian/` folder

twillm materialises a `.twillm-wiki/` working directory in your repo (dot-prefixed, so Obsidian ignores it; gitignore it). You can drop custom wikitext (`.tid`) tiddlers into `.twillm-wiki/tiddlers/` to extend the wiki.

To pull updates: `npx --prefer-online github:Jermolene/twillm` forces a re-check of the latest commit.

## Working with an LLM

Point your coding agent (Claude Code, Cursor, etc.) at your vault. It edits the `.md` files directly. TiddlyWiki's watcher sees the changes and updates the browser without a reload.

### Conventions for your agent

Most of what your agent needs to know — Markdown, YAML frontmatter, `[[wiki links]]`, where vault files live — it already knows from generic Markdown/Obsidian conventions. There are a few twillm-specific points you may want to add to your agent instructions (`CLAUDE.md`, `.cursorrules`, etc.):

```markdown
## Notes for editing this vault

- The wiki at http://localhost:8080 (when running) reflects vault edits live via filesystem watching.
- Frontmatter `title` wins over filename when they differ; keep them in sync where you can.
- Don't include `created`, `modified`, or `type` in frontmatter — TiddlyWiki manages timestamps,
  and `.md` extension implies the type. They'll round-trip out anyway.
- List fields (`tags`, `list`) should be YAML arrays: `tags: [concept, multi word tag]`.
- For TiddlyWiki UI tiddlers (wikitext, macros, dashboards) use `.tid` instead of `.md`,
  and put them in `.twillm-wiki/tiddlers/`.
```

twillm itself does not write any agent-instruction files into your repo.

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

## Developing twillm itself

```bash
git clone https://github.com/Jermolene/twillm.git
cd twillm
npm install     # pulls TW from the bidirectional-filesystem branch
npm start       # serves vault/ on http://localhost:8080
npm run build   # renders vault/ to .twillm-wiki/output/*.html
```

`npm update tiddlywiki` pulls the latest commits from the TW branch.

The repo's own `vault/` is the test fixture; the `template-wiki/` directory is what gets materialised into a user's `.twillm-wiki/` when they install.

## Status

Early development. See [handoff.md](handoff.md) for the full TODO list and design decisions.

## Credits

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — LLM Wiki pattern
