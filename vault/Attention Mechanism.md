---
title: Attention Mechanism
tags: [Concept, Attention]
rating: 8
created: "2025-02-01T13:45:00Z"
modified: "2025-10-12T16:20:00Z"
---

A neural network operation that lets a model focus on different parts of the input when producing each part of the output. First introduced by [[Bahdanau Attention|Bahdanau et al.]] (2014) for machine translation, it became the core building block of the [[Transformer]] architecture.

## Key idea

Instead of compressing the entire input into a fixed-length vector, attention computes a weighted sum over all input positions. The weights are learned functions of the *query* (what the current position is "looking for") and *keys* (what each input position "offers").

## Variants

- **Scaled dot-product attention** — used in Transformers. Computes `softmax(QK^T / sqrt(d_k)) V`.
- **[[Multi-Head Attention]]** — runs several attention functions in parallel with different learned projections.
- **[[Self-Attention]]** — queries, keys, and values all come from the same sequence.
- **Cross-attention** — queries come from one sequence, keys and values from another (e.g. encoder-decoder).
