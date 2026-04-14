# TWILLM

A TiddlyWiki-based LLM knowledge wiki, inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM maintains a vault of Markdown files; TiddlyWiki serves them to the human in a browser and picks up changes live. Use it alongside Obsidian against the same files.

## Why TiddlyWiki instead of Obsidian

Karpathy's pattern relies on Obsidian as the viewer over an LLM-authored vault. That works, but Obsidian's data model assumes notes are written by humans. Some friction shows when an LLM is the primary author:

**Computed views replace materialised index files.** Karpathy's setup uses an `index.md` that the LLM has to keep in sync as it adds notes. That's a maintenance burden the LLM is bad at — staleness creeps in across sessions. TiddlyWiki views are live filter expressions: a "tiddlers tagged `concept`, sorted by rating" view computes its contents at render time. Nothing to maintain. The LLM produces content; the views look after themselves.

**Frontmatter becomes queryable structure.** Obsidian shows YAML frontmatter as boxed metadata at the top of a note. TiddlyWiki promotes frontmatter fields into first-class tiddler fields you can filter, sort, and aggregate over: `[tag[concept]rating[]>[6]sort[title]]` returns "concept tiddlers I rated above 6, alphabetically". The LLM's ratings, statuses, dates, and custom fields turn into a small queryable database.

**LLM-authored UI, not just content.** Beyond Markdown notes, the LLM can drop in wikitext tiddlers (`.tid`) that act as small live views: dashboards, browse-by-tag tools, journal indexes, glossary pages. These compose with the human's own customisations because they're just tiddlers. The wiki becomes a programmable surface, not just a notes folder.

**No vendor split.** Obsidian's collaboration, sync, and publishing features are paid services with cloud accounts. TiddlyWiki is one HTML file or one Node.js process — you host it yourself, share it via GitHub Pages or Netlify, and there's no upgrade path that locks features behind a tier.

twillm doesn't replace Obsidian — it sits next to it. Both are filesystem-watching tools over the same `.md` files. Use whichever fits the task: Obsidian for browsing on iPad, TiddlyWiki when you want a live dashboard the LLM built for you.

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

twillm materialises a `twillm-wiki/` working directory in your repo on first run. This is **commit-friendly**: any customisations you make (wikitext `.tid` tiddlers, themes, plugins, site title) live there and can be shared via git alongside your vault. The dynamic-store config inside it uses relative paths so it works for all collaborators.

A few things inside `twillm-wiki/` are transient and should be gitignored:

```
twillm-wiki/output/
twillm-wiki/tiddlers/$__StoryList.tid
```

**Obsidian users:** `twillm-wiki/` contains only `.tid` and config files, which Obsidian doesn't index as notes. The folder shows up in Obsidian's file explorer but contributes nothing to the note graph. If you want it hidden entirely, add `twillm-wiki/` to Settings → Files & Links → Excluded Files.

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
npm run build   # renders vault/ to twillm-wiki/output/*.html
```

`npm update tiddlywiki` pulls the latest commits from the TW branch.

The repo's own `vault/` is the test fixture; the `template-wiki/` directory is what gets materialised into a user's `twillm-wiki/` on first run.

## Status

Early development. See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture notes, design decisions, and the TODO list.

## Credits

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — LLM Wiki pattern
