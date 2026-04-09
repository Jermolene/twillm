---
title: Positional Encoding
tags: [concept, transformer]
rating: 5
---

Since the [[Transformer]] processes all positions in parallel, it has no inherent notion of sequence order. Positional encodings inject position information into the model.

## Approaches

- **Sinusoidal** — fixed, frequency-based encodings from the original Transformer paper
- **Learned** — trainable embedding per position (used in GPT-2, BERT)
- **RoPE** — rotary position embeddings; encodes relative position via rotation matrices (used in Llama, most modern LLMs)
- **ALiBi** — adds linear bias to attention scores based on distance

## See also

- [[Transformer]]
- [[Attention Mechanism]]
