# TWILLM

A TiddlyWiki-based LLM knowledge wiki, inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM writes and maintains wiki content via MCP; the human reads it in a browser.

## Why TiddlyWiki instead of Obsidian

<!-- Jeremy to rewrite in own voice -->

- **Computed views, not stored files** — TiddlyWiki views are live filter expressions, not materialised Markdown files. Nothing goes stale. The LLM creates content, not index files.
- **MCP server** — structured retrieval via filter queries replaces filesystem scanning. The LLM asks the wiki, not the file system.
- **Queryable fields** — YAML frontmatter is extracted into native tiddler fields (tags, ratings, custom metadata), all searchable via filters.
- **LLM-authored UI** — wikitext tiddlers are live views and mini-apps. The LLM can program the wiki, not just populate it.
- **Free and open** — no paid tier, no vendor lock-in.

## Architecture

```
twillm/
├── sample-vault/              # Source documents (Markdown + YAML frontmatter)
├── wiki/
│   ├── tiddlywiki.info        # Wiki configuration
│   └── tiddlers/              # LLM-maintained tiddler files
├── plugins/                   # Vendored TiddlyWiki plugins
│   └── wikilabs/tw-mcp/       # MCP server plugin
├── tiddlywiki-wrapper/        # Custom boot (temporary, see below)
│   ├── start.js               # CLI entry point
│   ├── markdown-deserializer.js
│   └── yaml.js
└── .mcp.json                  # MCP config for Claude Code
```

The LLM interacts with the wiki through the MCP server, which exposes tools for reading, writing, querying, and rendering tiddlers. The human views the wiki in a browser at `http://localhost:8080`.

## Prerequisites

- **Node.js 22** or later

## Setup

```bash
git clone https://github.com/Jermolene/twillm.git
cd twillm
command -v tiddlywiki >/dev/null || npm install -g tiddlywiki
```

No `npm install` needed — the project has no npm dependencies. TiddlyWiki is resolved from your global install.

### Update vendored plugins

To pull the latest version of the MCP server plugin:

```bash
bash scripts/update-dependencies.sh
```

## Usage

### Start the wiki server

```bash
npm start
```

This starts a combined HTTP + MCP server:
- **Browser**: open `http://localhost:8080` to view and edit the wiki
- **MCP**: the same process serves MCP tools over stdio (for coding agents) and a named pipe (for helper tools)

The sample vault is loaded automatically on startup.

### Build static HTML

```bash
npm run build
```

Renders all Markdown tiddlers (including the sample vault) as static HTML files in `wiki/output/`.

### Run tests

```bash
npm test
```

### Connecting your coding agent

#### Claude Code (CLI or VS Code extension)

Works out of the box. The `.mcp.json` file in the project root configures Claude Code to start the MCP server automatically. Open the project in Claude Code and the TiddlyWiki MCP tools will be available.

#### Other agents (Gemini CLI, Cursor, etc.)

Point your agent's MCP configuration at this command:

```
node tiddlywiki-wrapper/start.js wiki --mcp readwrite
```

The server speaks MCP over stdio using JSON-RPC 2.0. PRs adding config files for other agents are welcome.

### Available MCP tools

Once connected, the LLM has access to these tools:

| Tool | Description |
|---|---|
| `get_tiddler` | Read a tiddler by title |
| `list_tiddlers` | List tiddler titles, filter by tag |
| `run_filter` | Run any TiddlyWiki filter expression |
| `render_tiddler` | Render wikitext to plain text or HTML |
| `put_tiddler` | Create or update a tiddler |
| `edit_tiddler` | Edit specific lines with conflict detection |
| `delete_tiddler` | Delete a tiddler |
| `get_wiki_info` | Wiki metadata, plugin list, tiddler counts |
| `reload_tiddlers` | Re-read tiddler files after external edits |

See [handoff.md](handoff.md) for the full tool list and MCP server audit.

## Tiddler format

The LLM writes Markdown files with YAML frontmatter:

```markdown
---
title: Some Concept
tags: [concept, synthesis]
rating: 6
---

Body in Markdown.
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
- [wikilabs/tw-mcp](https://wikilabs.github.io/editions/tw-mcp/) — Mario Pietsch
