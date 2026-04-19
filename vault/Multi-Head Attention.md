---
title: Multi-Head Attention
tags: [Concept, Attention, Architecture]
rating: 7
---

Runs several [[Self-Attention]] (or [[Attention Mechanism|cross-attention]]) operations in parallel, each with its own learned projection matrices, then concatenates the results and projects them back to the model dimension.

## Motivation

A single attention head can only learn one pattern of what to attend to. Multiple heads let the model jointly attend to information from different representation subspaces — one head might track syntactic dependencies, another semantic similarity, another positional patterns.

## Mechanics

Given `h` heads and model dimension `d`:

1. For each head `i`, project to lower-dimensional `Q_i`, `K_i`, `V_i` (each of dimension `d/h`)
2. Compute attention independently per head: `head_i = Attention(Q_i, K_i, V_i)`
3. Concatenate: `H = [head_1; ...; head_h]`
4. Project back: `output = H · W_O`

Total parameters are the same as a single attention with dimension `d`, but the computation is split across subspaces.

## In practice

Modern LLMs use 16–128 heads. Variants like **Multi-Query Attention** and **Grouped-Query Attention** share keys and values across heads to reduce [[KV Cache]] memory at inference time.

## See also

- [[Self-Attention]]
- [[Transformer]]
