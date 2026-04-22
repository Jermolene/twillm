# Working on twillm

This is the twillm project repo, not an end-user vault. twillm is a Node CLI that materialises a TiddlyWiki working directory (`twillm-wiki/`) in a user's repo and serves their Markdown vault as a live-watched TiddlyWiki.

End-user docs are in [README.md](README.md). Architecture notes, design decisions, and the TODO list are in [DEVELOPMENT.md](DEVELOPMENT.md). Read both before non-trivial changes.

## Repo layout

- `cli.js` — CLI entry point. Detects the user's vault, materialises `twillm-wiki/`, spawns TiddlyWiki.
- `template-wiki/` — the wiki template that gets copied into a user's `twillm-wiki/` on first run. Edit here to change what users get.
- `vault/` — test fixture. Sample Markdown content used by `npm start` and `npm run build`.
- `handoff.md`, `README.md`, `CLAUDE.md` — docs.
- `twillm-wiki/` — generated at runtime by `npm start` / `npm run build`. Gitignored. Don't commit.

## Editing the test vault

The tiddlers in `vault/` are demo content. Add to them when you want to exercise something live (rendering, watcher behaviour, link resolution). Same conventions a user would follow:

- Markdown with YAML frontmatter
- One tiddler per file: `vault/<Title>.md`
- Frontmatter `title` should match filename
- `tags` as YAML arrays: `tags: [concept, multi word tag]`
- Don't include `type` — `.md` implies `text/x-markdown` and it round-trips out
- `created`/`modified` are optional; if present they round-trip as ISO-8601 strings
- Wiki links: `[[Target Title]]` or `[[Display|Target Title]]`

## Editing template-wiki/

This is what users get. Be conservative — every change ships to everyone who runs `npx github:Jermolene/twillm`.

- `template-wiki/tiddlywiki.info` — wiki configuration. Plugins listed here are required of every user.
- `template-wiki/tiddlers/$__SiteTitle.tid`, `$__SiteSubtitle.tid` — defaults users will probably override
- `template-wiki/tiddlers/$__config_SyncPollingInterval.tid` — controls how often the browser polls. 2 seconds today.
- `template-wiki/tiddlers/vault-loader/tiddlywiki.files` — overwritten at runtime by cli.js with the user's absolute vault path. Don't rely on its contents.

## Editing cli.js

- Vault detection order is documented in the file header. Don't reorder without updating docs.
- The `twillm-wiki/` materialisation is idempotent: copy template only if the directory doesn't exist; rewrite `vault-loader/tiddlywiki.files` every run (vault path may have moved).
- Pass-through args after `--` go to TiddlyWiki. Default command is `--listen` if nothing was passed.

## Don't run servers without being asked

`npm start` and `node ./cli.js …` start a long-lived HTTP server on port 8080. Don't start one to "test" something — the user may already have one running, and you'll either fail (`EADDRINUSE`) or leak a process. Ask first.

`npm run build` is fine to run; it terminates after rendering.

## Upstream

Several load-bearing pieces live in TiddlyWiki itself, on the [`bidirectional-filesystem` branch](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806):
- Dynamic store filesystem watching
- YAML frontmatter deserializer + serializer in `plugins/tiddlywiki/markdown/`
- Boot-ordering fix for plugin-provided deserializers
- `tiddlerserializer` module type

If you find a bug whose root cause is in TiddlyWiki, surface it (don't paper over with a workaround in twillm). Jeremy maintains both repos and can fix upstream.

## Style

- Don't add `## See also` sections to docs out of habit. Only when there's something non-obvious to point to.
- Don't pad. Each section earns its place.
- No emojis unless explicitly requested.
- Prefer editing existing files over creating new ones.
- Follow the conventions in [README.md](README.md) when adding to `vault/` so the test fixture stays consistent with what we tell users.
