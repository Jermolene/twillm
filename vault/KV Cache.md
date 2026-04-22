---
title: KV Cache
tags: [Concept, Inference]
rating: 8
created: "2025-07-25T14:10:00Z"
modified: "2026-03-20T09:58:00Z"
---

*This tiddler is part of the demo vault shipped with twillm.*

The Key-Value cache: an inference-time optimization for autoregressive [[Transformer]] models that avoids recomputing attention keys and values for tokens the model has already seen.

## The problem

When generating token `t`, a decoder-only model performs [[Self-Attention]] over all preceding tokens `0..t-1`. Naively, this means at each generation step the model recomputes `K` and `V` projections for every prior token — even though those tokens haven't changed.

For a sequence of length `n`, generation is `O(n²)` in total — and every subsequent token makes the problem worse.

## The fix

Cache the keys and values from previous steps. At step `t`:

1. Compute `Q`, `K`, `V` **only for the new token**
2. Append new `K` and `V` to the cache for each layer and each head
3. Compute attention of the new `Q` against the full cached `K`/`V`

Generation becomes `O(n)` per token — linear in context length instead of quadratic.

## Memory cost

The cache grows with context length, layers, heads, and head dimension:

```
cache_size = 2 · batch · seq_len · layers · heads · head_dim · bytes_per_element
```

For a 70B model with 80 layers, 64 heads, head dim 128, at bf16 and a 32K context, the cache is tens of gigabytes per request. This is typically the dominant memory consumer during LLM inference, not the model weights.

Cache size scales with [[Tokenization|tokens]], not characters — see [[Tokenization]].

## Related optimizations

- **Multi-Query / Grouped-Query Attention** — share K/V across [[Multi-Head Attention|heads]] to shrink the cache
- **Paged attention** (vLLM) — non-contiguous cache allocation to reduce fragmentation
- **Quantized KV cache** — store K/V in int8 or int4 to trade accuracy for memory
- **Sliding window / attention sink** — cap the cache size by dropping old tokens
