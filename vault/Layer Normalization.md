---
title: Layer Normalization
tags: [Concept, Architecture]
rating: 7
created: "2025-03-18T07:25:00Z"
modified: "2025-08-19T12:40:00Z"
---

A normalization technique applied within each [[Transformer]] block to keep activations on a stable scale during training. Without it, deep transformers don't train reliably.

## What it does

For each token's hidden vector independently, normalize the vector to zero mean and unit variance, then apply a learned scale and shift:

```
LN(x) = γ · (x - μ) / √(σ² + ε) + β
```

where `μ` and `σ²` are computed across the *features* of `x` (not across the batch, unlike BatchNorm). This makes the operation independent of batch size — important for autoregressive generation, where batch size at inference is often 1.

## Where it goes

Two conventions:

- **Post-LN** — original [[Transformer]] paper. LayerNorm applied *after* the residual addition. Trains poorly without learning-rate warmup; mostly abandoned.
- **Pre-LN** — modern default (GPT-2 onward). LayerNorm applied *before* the [[Self-Attention]] / FFN sublayer, inside the residual path. Trains much more stably and is what virtually all current LLMs use.

## RMSNorm

A simplification used by Llama, Gemma, Qwen, and most modern open-weight models:

```
RMSNorm(x) = γ · x / √(mean(x²) + ε)
```

Drops the mean-subtraction and the bias term. Slightly cheaper to compute, slightly fewer parameters, and empirically works as well as full LayerNorm in deep transformer stacks.
