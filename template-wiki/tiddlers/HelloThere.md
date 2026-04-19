---
title: HelloThere
tags: [$:/tags/twillm-shell]
---

Welcome. You're looking at your Markdown vault served as a live [[TiddlyWiki|https://tiddlywiki.com]] by **twillm**. Edits you make in the browser — including to this tiddler — are written to disk immediately; edits to your `.md` files made elsewhere (your coding agent, another editor, `git pull`) show up here without a reload.

[img[architecture.svg]]


This tiddler and the demo views below come from twillm's starter template. Edit, replace, or delete them as you make the wiki your own — your changes are saved in `twillm-wiki/` next to your vault, separate from vault content.

## Concept map

A live graph of the tiddlers, their tags, and their wiki links. Click a node to open the tiddler; click and drag to rearrange.

<$graph.view $tiddler="$:/graph/Default"/>

## Neighbourhood of <$text text={{{ [all[tiddlers]!is[system]!tag[$:/tags/twillm-shell]first[]] }}}/>

A focused graph of everything that links to or from <$link to={{{ [all[tiddlers]!is[system]!tag[$:/tags/twillm-shell]first[]] }}}><$text text={{{ [all[tiddlers]!is[system]!tag[$:/tags/twillm-shell]first[]] }}}/></$link> — useful when a single hub concept is what you care about.

<$graph.view $tiddler="$:/graph/Neighbourhood"/>

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
