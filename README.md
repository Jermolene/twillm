# TWILLM

A TiddlyWiki-based LLM knowledge wiki, inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM maintains an Obsidian-compatible vault of Markdown files which TiddlyWiki serves to a browser. Changes to the vault are picked up immediately and reflected in the brwowser.

## Why TiddlyWiki instead of Obsidian

Karpathy's pattern uses Obsidian as the viewer over an LLM-authored vault. Replacing or augmenting it with TiddlyWiki offers some useful benefits:

**Completely open source** TiddlyWiki is published under a permissive BSD license that gives complete freedom to users

**Computed views replace materialised index files** Karpathy's setup uses an `index.md` that the LLM has to keep in sync as it adds notes. That is something that LLMs are bad at — staleness creeps in across sessions. In contrast, TiddlyWiki views are live filter expressions: a "tiddlers tagged `concept`, sorted by rating" view computes its contents at render time

**Frontmatter becomes queryable structure** Obsidian shows YAML frontmatter as boxed metadata at the top of a note. TiddlyWiki promotes frontmatter fields into first-class tiddler fields you can filter, sort, and aggregate over: `[tag[concept]rating[]>[6]sort[title]]` returns "concept tiddlers I rated above 6, alphabetically". The LLM's ratings, statuses, dates, and custom fields turn into a small queryable database

**LLM-authored applets, not just content** Beyond Markdown notes, the LLM can drop in wikitext tiddlers (`.tid`) that act as small interactive live views: dashboards, browse-by-tag tools, journal indexes, glossary pages. These compose with the human's own customisations because they're just tiddlers. The wiki becomes a programmable surface, not just a notes folder

## Prerequisites

- **Node.js 22** or later

twillm bundles a TiddlyWiki build from the [`bidirectional-filesystem` branch](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806) which implements the required new functionality: live filesystem watching (`dynamicStore` in `tiddlywiki.files`) and the YAML frontmatter deserializer/serializer in the Markdown plugin. The standard `tiddlywiki` npm release will not work.

## Usage

You can try out twillm with your own data, or with the bundled demo vault.

### If you already have a vault

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

twillm creates a `twillm-wiki/` working directory in your repo on first run. This is **commit-friendly**: any customisations you make (wikitext `.tid` tiddlers, themes, plugins, site title) live there and can be shared via git alongside your vault. The dynamic-store config inside it uses relative paths so it works for all collaborators.

A few things inside `twillm-wiki/` are transient and should be gitignored:

```
twillm-wiki/output/
twillm-wiki/tiddlers/$__StoryList.tid
```

**Obsidian users:** `twillm-wiki/` contains only `.tid` and config files, which Obsidian doesn't index as notes. The folder shows up in Obsidian's file explorer but contributes nothing to the note graph. If you want it hidden entirely, add `twillm-wiki/` to Settings → Files & Links → Excluded Files.

To pull updates: `npx --prefer-online github:Jermolene/twillm` forces a re-check of the latest commit.

### If you do not already have a vault

If you just want to try twillm without an existing vault:

```bash
git clone https://github.com/Jermolene/twillm.git
cd twillm
npm install
npm start
```

This serves the bundled demo vault (`vault/`) at `http://localhost:8080`. To pick up the latest changes later:

```bash
git pull
npm install
npm start
```

## Working with an LLM

Point your coding agent (Claude Code, Cursor, etc.) at your vault. It edits the `.md` files directly. TiddlyWiki's watcher sees the changes and updates the browser without a reload.

### Conventions for your agent

Most of what your agent needs to know — Markdown, YAML frontmatter, `[[wiki links]]`, where vault files live — it already knows from generic Markdown/Obsidian conventions. There are a few twillm-specific points you may want to add to your agent instructions (`CLAUDE.md`, `.cursorrules`, etc.):

```markdown
## Notes for editing this vault

- The wiki at http://localhost:8080 (when running) reflects vault edits live via filesystem watching.
- Frontmatter `title` wins over filename when they differ; keep them in sync where you can.
- `created`/`modified` are optional; if present they round-trip as ISO-8601 strings.
  Omit `type` — `.md` extension implies `text/x-markdown` and it rounds-trip out.
- List fields (`tags`, `list`) should be YAML arrays: `tags: [concept, multi word tag]`.
- For TiddlyWiki UI tiddlers (wikitext, macros, dashboards) use `.tid` instead of `.md`,
  and put them in `twillm-wiki/tiddlers/`.
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

## Developing twillm

See [DEVELOPMENT.md](DEVELOPMENT.md).

## Credits

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — LLM Wiki pattern
