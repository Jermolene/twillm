---
title: HelloThere
tags: [$:/tags/twillm-shell]
---

Welcome. You're looking at your Markdown vault served as a live [[TiddlyWiki|https://tiddlywiki.com]] by **twillm**. Edits you make in the browser — including to this tiddler — are written to disk immediately; edits to your `.md` files made elsewhere (your coding agent, another editor, `git pull`) show up here without a reload.

[img[architecture.svg]]


This tiddler and the demo views below come from twillm's starter template. Edit, replace, or delete them as you make the wiki your own — your changes are saved in `twillm-wiki/` next to your vault, separate from vault content.

If you don't know TiddlyWiki you can take this brief interactive tour:

{{$:/twillm/start-tour-button}}

## Tiddlers by topic

Topic tiddlers group related concepts. Click through to see what's tagged.

<ul>
<$list filter="[tag[Topic]sort[title]]">
<li><$link><$view field="title"/></$link> — <$count filter="[tag<currentTiddler>!tag[Topic]]"/> tiddlers</li>
</$list>
</ul>

## Highest-rated concepts

The `rating` field from each tiddler's YAML frontmatter becomes a queryable tiddler field. Sorted descending:

<ul>
<$list filter="[!is[system]has[rating]!tag[Topic]!tag[$:/tags/twillm-shell]sort[rating]reverse[]limit[5]]">
<li><$link><$view field="title"/></$link> ({{!!rating}}) — <$view field="tags"/></li>
</$list>
</ul>
