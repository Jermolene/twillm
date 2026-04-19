---
title: Bahdanau Attention
tags: [Paper, Attention]
rating: 6
---

The original attention mechanism in neural networks, introduced by Bahdanau, Cho, and Bengio in "Neural Machine Translation by Jointly Learning to Align and Translate" (2014).

## Context

Prior sequence-to-sequence models compressed the entire source sentence into a single fixed-length vector from the encoder's final hidden state. This became a bottleneck for long sentences — information from early tokens got squeezed out.

Bahdanau's insight: let the decoder *look back* at the full encoder output at every step, with learned weights over which source positions matter most for the current target position.

## Mechanism

At each decoder step `t`:

1. Compute alignment scores: `e_{t,i} = a(s_{t-1}, h_i)` — a small feedforward network `a` scores each encoder hidden state `h_i` against the previous decoder state
2. Normalize: `α_{t,i} = softmax(e_{t,i})`
3. Context vector: `c_t = Σ α_{t,i} · h_i`
4. Decoder uses `c_t` alongside its own state

This is *additive attention* (the scoring function `a` is a small MLP). Later work — particularly the [[Transformer]] — used *multiplicative/dot-product* [[Attention Mechanism|attention]] for efficiency.

## Historical importance

- First demonstration that attention solved the fixed-context bottleneck
- Produced interpretable alignment matrices showing which source words mapped to which target words
- Set the conceptual stage for the [[Attention Mechanism|general attention framework]] and eventually [[Self-Attention]] and the [[Transformer]]
