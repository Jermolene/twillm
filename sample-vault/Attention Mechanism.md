---
title: Attention Mechanism
tags: [concept, transformer, architecture]
rating: 8
---

The attention mechanism allows a model to focus on different parts of the input when producing each part of the output. First introduced in [[Bahdanau et al. 2014]] for machine translation, it became the core building block of the [[Transformer]] architecture.

## Key idea

Instead of compressing the entire input into a fixed-length vector, attention computes a weighted sum over all input positions. The weights are learned functions of the query and key vectors.

## Variants

- **Scaled dot-product attention** — used in Transformers. Computes `softmax(QK^T / sqrt(d_k)) V`.
- **Multi-head attention** — runs several attention functions in parallel, concatenates, and projects.
- **Cross-attention** — queries come from one sequence, keys and values from another.

## See also

- [[Transformer]]
- [[Self-Attention]]
