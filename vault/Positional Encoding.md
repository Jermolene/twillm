---
title: Positional Encoding
tags: [Concept, Position, Architecture]
rating: 7
created: "2025-03-22T12:05:00Z"
modified: "2026-01-25T13:30:00Z"
---

Since the [[Transformer]] processes all positions in parallel via [[Self-Attention]], it has no inherent notion of sequence order. Positional encodings inject position information into the model.

## Approaches

- **Sinusoidal** — fixed, frequency-based encodings from the original [[Transformer]] paper
- **Learned** — trainable embedding per position (used in GPT-2, BERT)
- **[[RoPE]]** — rotary position embeddings; encodes relative position via rotation matrices (used in Llama and most modern LLMs)
- **ALiBi** — adds linear bias to attention scores based on distance

## Why it's tricky

Self-attention's strength — content-based routing independent of position — is also why position needs to be added back in. The choice of encoding affects:

- **Generalisation to longer sequences** than seen during training (extrapolation)
- **Compute cost** at inference (some encodings interact with the [[KV Cache]])
- **Training stability** in deep stacks
