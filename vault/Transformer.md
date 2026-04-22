---
title: Transformer
tags: [Concept, Architecture]
rating: 9
created: "2025-02-28T18:00:00Z"
modified: "2026-04-10T11:35:00Z"
---

The Transformer is a neural network architecture introduced in "Attention Is All You Need" (Vaswani et al., 2017). It replaced recurrence with [[Self-Attention]], enabling massive parallelism and the scaling that made modern large language models possible.

## Architecture

A Transformer is a stack of identical blocks. Each block has two sub-layers:

- A [[Multi-Head Attention]] layer
- A position-wise feedforward network

Both sub-layers are wrapped with residual connections and [[Layer Normalization]]. Since attention is permutation-invariant, position information is injected via [[Positional Encoding]].

The original paper had an encoder-decoder structure for machine translation. Modern LLMs (GPT, Claude, Llama) are typically decoder-only — a single stack with masked self-attention.

## Why it matters

The Transformer is the foundation of essentially all modern large language models. Its key advantage is that self-attention has O(1) sequential operations per layer (vs O(n) for RNNs), enabling efficient training on long sequences with hardware parallelism.

## Lineage

The Transformer's [[Attention Mechanism]] is a generalisation of [[Bahdanau Attention]] (2014), reapplied as the *only* operation rather than as an addition to recurrence.
