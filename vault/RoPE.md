---
title: RoPE
tags: [concept, positional-encoding, transformer]
aliases: [Rotary Position Embedding, Rotary Positional Encoding]
rating: 8
---

Rotary Position Embedding. A [[Positional Encoding]] scheme that encodes absolute position by rotating query and key vectors in 2D subspaces, and whose dot product naturally expresses *relative* position. Introduced by Su et al. in the RoFormer paper (2021).

## Intuition

Given a pair of dimensions `(2i, 2i+1)` in a query or key vector, RoPE rotates that 2D sub-vector by angle `mθ_i`, where `m` is the token's position and `θ_i = base^(-2i/d)` is a frequency that varies across dimension pairs (low `i` = high frequency, high `i` = low frequency).

When you compute the dot product of a query at position `m` and a key at position `n`, the rotation angles partially cancel: the result depends on `m - n`, i.e. the *relative* position. Absolute position goes in, relative position comes out.

## Why it matters

- **Relative without extra parameters** — unlike learned relative position biases, RoPE needs no additional weights
- **Extrapolation (kind of)** — works reasonably well at inference lengths somewhat beyond training, especially with techniques like NTK scaling or YaRN
- **Standard in modern LLMs** — Llama, Qwen, Mistral, DeepSeek, and most current open-weight models use RoPE

## Limitations

- Vanilla RoPE degrades sharply past training length; production long-context models use scaling tricks (position interpolation, NTK-aware scaling, YaRN)
- Frequency base (`theta`, often 10000 or 500000) affects long-context behaviour significantly

## See also

- [[Positional Encoding]]
- [[Self-Attention]]
- [[Transformer]]
