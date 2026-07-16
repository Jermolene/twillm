# twillm — Development notes

Notes for anyone working on twillm. End-user documentation is in [README.md](README.md). Agent instructions for editing this repo are in [CLAUDE.md](CLAUDE.md).

## Quickstart

```bash
git clone https://github.com/Jermolene/twillm.git
cd twillm
npm install     # pulls TW from the bidirectional-filesystem branch
npm start       # serves vault/ on http://localhost:8080
npm run build   # renders vault/ to twillm-wiki/output/*.html
```

`npm update tiddlywiki` pulls the latest commits from the TW branch.

The repo's own `vault/` is the test fixture; `template-wiki/` is the source that gets materialised into a user's `twillm-wiki/` on first run.

In this repo, `twillm-wiki/` itself is gitignored — it's a dev-time build artifact, regenerated each `npm start` / `npm run build`. If you want to change what ships to users, edit `template-wiki/`. In end-user repos, `twillm-wiki/` is the opposite: commit-friendly (users' customisations live there).

## Repo layout

```
./
├── README.md                   # End-user docs
├── DEVELOPMENT.md              # This file
├── CLAUDE.md                   # Instructions for an LLM editing this repo
├── LICENSE
├── package.json                # bin: twillm → ./cli.js; deps: tiddlywiki
├── cli.js                      # Entry point: detects vault, materialises wiki, spawns TW
├── .gitignore
├── vault/                      # Test fixture — sample LLM-authored content
└── template-wiki/              # Wiki template materialised into twillm-wiki/ on first run
    ├── tiddlywiki.info
    └── tiddlers/
        ├── $__DefaultTiddlers.tid
        ├── $__SiteTitle.tid
        ├── $__SiteSubtitle.tid
        ├── $__config_SyncPollingInterval.tid
        ├── $__graph_Default.tid          # Full concept-map graph view
        ├── $__graph_Neighbourhood.tid    # Neighbourhood graph view
        ├── HelloThere.md                 # Landing page
        ├── architecture.svg              # Architecture diagram (SVG + .meta)
        ├── architecture.svg.meta
        └── vault-loader/
            └── tiddlywiki.files  # Placeholder; overwritten at run time
```

End-user run path:

```
$ cd my-vault-repo
$ npx github:Jermolene/twillm
```

`cli.js` detects the vault, materialises `twillm-wiki/` (commit-friendly — users can add custom tiddlers and commit), rewrites the dynamic-store config with a relative path to the vault, then spawns `tiddlywiki twillm-wiki/ --listen`.

## Tech stack

- **TiddlyWiki** pulled in as a git dependency from the `bidirectional-filesystem` branch (PR [#9806](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806)). `npm install` fetches it; `npm update tiddlywiki` re-pulls. This branch carries the load-bearing pieces:
  - `dynamicStore` support in `tiddlywiki.files` — chokidar-based filesystem watching
  - YAML frontmatter deserializer + serializer in `plugins/tiddlywiki/markdown/`
  - Boot-ordering fix so plugin-provided deserializers are available when wiki tiddler files load
  - `tiddlerserializer` module type for round-tripping non-`text/vnd.tiddlywiki` tiddlers as single files (no `.meta` sidecar)
- **`tiddlywiki/markdown`** plugin — renders `.md` tiddler bodies, extracts YAML frontmatter at boot, and writes it back on save
- **`tiddlywiki/tiddlyweb`** plugin — HTTP server for the browser
- **`tiddlywiki/filesystem`** plugin — filesystem syncadaptor with dynamic-store watcher
- **Node.js 22**

## YAML frontmatter (deserializer + serializer)

Both live in TiddlyWiki's `plugins/tiddlywiki/markdown/`:

- `frontmatter-deserializer.js` — `tiddlerdeserializer` for `text/markdown` and `text/x-markdown`
- `frontmatter-serializer.js` — `tiddlerserializer` for the same two types
- `yaml.js` — minimal js-yaml-API-compatible parser (library module)

Round-trip:

- **Load**: `---` YAML frontmatter → tiddler fields. Arrays on list fields (tags, list) → TW bracketed lists. Other non-string values → JSON. `created`/`modified` ignored. Existing tags merged with frontmatter tags.
- **Save**: tiddler fields → YAML frontmatter, body → after the closing `---`. `text`/`created`/`modified`/`bag`/`revision` skipped from frontmatter. `type: text/x-markdown` omitted (default for `.md`). List fields → YAML arrays. Title emitted first.

Tests in `editions/test/tiddlers/tests/test-markdown-frontmatter.js`.

## Testing and CI

`npm test` runs `test/smoke.js`, an end-to-end exercise of `cli.js` in a temp directory. It asserts the contracts README.md makes to users: materialisation with a relative vault-loader path, never-overwrite persistence of user edits (issue #1), propagation of new template files, no `.DS_Store` leakage, and headless commands (`--version`, `--render`) exiting by themselves. It starts no server, so it's always safe to run.

CI (`.github/workflows/ci.yml`) runs the smoke test in two ways:

- **Push / PR** — `npm ci` against the lockfile pin, testing exactly what's committed.
- **Nightly (05:17 UTC) and manual dispatch** — installs the `bidirectional-filesystem` branch HEAD instead. Because the tiddlywiki dependency tracks that moving branch, upstream can break twillm without any commit here; this job catches the drift within a day.

After pushing to `bidirectional-filesystem`, trigger the workflow manually ("Run workflow" on the Actions tab, or `gh workflow run CI`) for immediate feedback instead of waiting for the nightly.

If you fork twillm, the same applies to your fork, with two GitHub caveats: Actions must be enabled on the fork before any workflow runs, and GitHub suspends scheduled workflows in repos with no activity for 60 days, so a dormant fork silently loses the nightly drift check. Manual dispatch always works once Actions are enabled.

## Dynamic store config

Generated by `cli.js` and written to `twillm-wiki/tiddlers/vault-loader/tiddlywiki.files` on every run. The file in `template-wiki/` is a placeholder. The generated file uses a relative path from the loader directory to the vault, so it's portable across collaborators with the same repo layout; it falls back to an absolute path if the vault is on a different drive.

Shape:

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

`saveFilter: [!is[system]]` routes all non-system tiddler saves to the vault directory.

