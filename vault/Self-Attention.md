---
title: Self-Attention
tags: [Concept, Attention, Architecture]
rating: 9
created: "2025-01-22T09:40:00Z"
modified: "2026-03-01T15:12:00Z"
---

A specific application of the [[Attention Mechanism]] where a sequence attends to itself: the queries, keys, and values are all linear projections of the same input. The core operation inside the [[Transformer]].

## How it works

For a sequence of token embeddings `X`:

1. Project into three matrices: `Q = X·W_Q`, `K = X·W_K`, `V = X·W_V`
2. Compute attention scores: `A = softmax(Q·K^T / sqrt(d_k))`
3. Output: `A·V`

Each token's output is a weighted sum of *all* tokens' values, where the weights are learned functions of token-to-token similarity.

## Why it's powerful

- **Parallelism** — unlike RNNs, all positions are computed simultaneously
- **Long-range dependencies** — the path length between any two positions is O(1)
- **Content-based routing** — attention weights depend on what the tokens contain, not just their positions (though see [[Positional Encoding]] for how position gets reintroduced)

## Variants

- **Masked self-attention** — used in decoder blocks; future positions are masked out so each position only attends to itself and earlier positions
- **[[Multi-Head Attention]]** — runs several independent self-attention operations in parallel and concatenates them
- The [[KV Cache]] is what makes self-attention tractable at inference time

## See also

- [[Attention Mechanism]] — the general framework
- [[Transformer]] — where self-attention lives
