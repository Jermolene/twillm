---
title: Transformer
tags: [concept, architecture, foundational]
rating: 9
---

The Transformer is a neural network architecture introduced in "Attention Is All You Need" (Vaswani et al., 2017). It replaced recurrence with [[Attention Mechanism|self-attention]], enabling massive parallelism and scaling.

## Architecture

- **Encoder** — stack of self-attention + feedforward layers
- **Decoder** — adds cross-attention over encoder output; uses causal masking

Modern LLMs (GPT, Claude, Llama) are typically decoder-only.

## Why it matters

The Transformer is the foundation of essentially all modern large language models. Its key advantage is that self-attention has O(1) sequential operations (vs O(n) for RNNs), enabling efficient training on long sequences with hardware parallelism.

## See also

- [[Attention Mechanism]]
- [[Positional Encoding]]
