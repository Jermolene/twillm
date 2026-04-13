# Known bugs

Two bugs in TiddlyWiki's `bidirectional-filesystem` branch (PR [#9806](https://github.com/TiddlyWiki/TiddlyWiki5/pull/9806)) that affect twillm. Both need upstream fixes.

---

## Bug 1 — URL-encoded filepath on save for dynamic-store tiddlers

### Symptom

Edit `Transformer` in the browser; the save lands at:

```
vault/%2FUsers%2Fjeremyruston%2Fgit%2FJermolene%2Fvault%2FTransformer.md.meta
```

(a URL-encoded absolute path used as the filename) instead of overwriting `vault/Transformer.md`.

### Reproduction

1. Load `vault/Transformer.md` via a `dynamicStore` directive in `tiddlywiki.files` (the store directory is outside `wiki/tiddlers/`).
2. Open the wiki in a browser and edit the `Transformer` tiddler.
3. Save.
4. A new file appears in the store directory with a URL-encoded absolute path as its filename.

### Root cause

The `originalpath` is computed relative to `wikiTiddlersPath`, but the save path resolves it against the dynamic store's `directory`.

- [`boot/boot.js:2360`](../TiddlyWiki5/boot/boot.js#L2360): on load, `fileInfo.originalpath = path.relative($tw.boot.wikiTiddlersPath, fileInfo.filepath)`. For `vault/Transformer.md` this gives `../../vault/Transformer.md`.
- [`plugins/tiddlywiki/filesystem/filesystemadaptor.js:93`](../TiddlyWiki5/plugins/tiddlywiki/filesystem/filesystemadaptor.js#L93): on save, `directory = store ? store.directory : this.boot.wikiTiddlersPath`. For a dynamic-store tiddler this is the store directory, e.g. `/.../twillm/vault/`.
- [`core-server/filesystem.js:335-338`](../TiddlyWiki5/core-server/filesystem.js#L335-L338): `generateTiddlerFilepath` uses `originalpath` (with extension stripped) as the `filepath` component.
- [`core-server/filesystem.js:383`](../TiddlyWiki5/core-server/filesystem.js#L383): `fullPath = path.resolve(directory, filepath + extension)` = `path.resolve('/.../twillm/vault/', '../../vault/Transformer.md')` = `/.../Jermolene/vault/Transformer.md` — **missing `twillm/`**.
- [`core-server/filesystem.js:398-402`](../TiddlyWiki5/core-server/filesystem.js#L398-L402): the allowed-prefix check fails (the path doesn't start with any of `wikiTiddlersPath`, `path.resolve(directory)`, `wikiPath`, or `path.resolve(wikiTiddlersPath, originalpath)` — the last one comes *close* but uses `wikiTiddlersPath`, not `directory`).
- [`core-server/filesystem.js:404-406`](../TiddlyWiki5/core-server/filesystem.js#L404-L406): fallback encodes the broken path: `writePath = path.resolve(directory, encodeURIComponentExtended(fullPath))`.

Result: `/.../twillm/vault/%2FUsers%2F...%2Fvault%2FTransformer.md`.

### Fix options

- **Store `originalpath` per-store.** When a tiddler belongs to a dynamic store, make `originalpath` relative to `store.directory` at boot, not `wikiTiddlersPath`. This is the most direct fix; `boot.js:2354-2366` already has `fileInfo`, and the dynamicStoreId is known.
- **Resolve correctly at save time.** In `generateTiddlerFilepath`, when the tiddler is destined for a dynamic store, resolve `originalpath` against the correct base (whichever it was originally computed from) rather than against `directory`. Requires plumbing the base through.
- **Don't use `originalpath` for dynamic-store saves.** Treat the store directory as authoritative: regenerate the filename from the title plus extension, ignoring `originalpath`. Simplest but changes semantics (loses path preservation for nested files inside the store).

The first option looks cleanest.

### Allowed-prefix check — candidate cleanup

Line 402 checks `writePath.indexOf(path.resolve(wikiTiddlersPath, originalpath)) == 0`. Given that `path.resolve(wikiTiddlersPath, '../../vault/Transformer.md')` = `/.../twillm/vault/Transformer.md`, and the *correct* save path is also `/.../twillm/vault/Transformer.md`, this check would have succeeded — had `fullPath` not been computed relative to the wrong base. Once Bug 1 is fixed at the `fullPath` computation site, this line may become redundant (or may still be useful as defence in depth).

---

## Bug 2 — Markdown tiddlers save as `.md` + `.md.meta` instead of Markdown with YAML frontmatter

### Symptom

A tiddler with `type: text/x-markdown` (loaded from a `.md` file whose YAML frontmatter was extracted into fields) is saved as two files:

- `Transformer.md` — just the body
- `Transformer.md.meta` — the fields

We want the round-trip to preserve the single-file format: one `.md` file with YAML frontmatter followed by the body.

### Root cause

This is not a bug in the PR per se — it's a pre-existing design limitation. There is no tiddler *serializer* corresponding to our YAML frontmatter deserializer. TiddlyWiki loads `.md` files with frontmatter (via the twillm deserializer) but has no mechanism to write them back out in the same format.

[`core-server/filesystem.js:236-245`](../TiddlyWiki5/core-server/filesystem.js#L236-L245) decides the save format based on tiddler type:

```js
var tiddlerType = tiddler.fields.type || "text/vnd.tiddlywiki";
if(tiddlerType === "text/vnd.tiddlywiki" || tiddlerType === "text/vnd.tiddlywiki-multiple" || tiddler.hasField("_canonical_uri")) {
    // Save as a .tid file
    fileInfo.type = "application/x-tiddler";
    fileInfo.hasMetaFile = false;
} else {
    // Save as a text/binary file and a .meta file
    fileInfo.type = tiddlerType;
    fileInfo.hasMetaFile = true;
}
```

Anything that isn't `text/vnd.tiddlywiki` (including `text/x-markdown`) falls into the `hasMetaFile: true` branch.

Then [`core-server/filesystem.js:417-432`](../TiddlyWiki5/core-server/filesystem.js#L417-L432) (`saveTiddlerToFile`) writes body and `.meta` separately based on `hasMetaFile`.

### Fix options

- **Add a serializer dispatch in `saveTiddlerToFile`** mirroring the `tiddlerdeserializer` module system — i.e. a `tiddlerserializer` module type that registers for a content type and returns the file text. For `text/x-markdown`, our serializer would emit `---\n<yaml frontmatter>\n---\n\n<body>`. This mirrors the load path symmetrically and would let other plugins extend save-side formats too.
- **Special-case `text/x-markdown` in core** — detect markdown-typed tiddlers in `generateTiddlerFileInfo` / `saveTiddlerToFile`, emit frontmatter inline, skip the `.meta` file. Quick but doesn't generalise.
- **Hook in `saveTiddlerToFile`** — fire a hook that lets an extension take over the write for specific types. Similar to option 1 but via hooks rather than module type.

Option 1 is the most principled. If we take that route, the YAML frontmatter serializer would live in `tiddlywiki-wrapper/` alongside the deserializer (same bootstrap story — register before boot, eventually merge into the Markdown plugin).

### Dependency on Bug 1

Until Bug 1 is fixed, the save path is broken regardless of Bug 2 — the wrong filename is generated. Fix Bug 1 first, then address Bug 2.
