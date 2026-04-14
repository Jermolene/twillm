---
title: Tokenization
tags: [concept, nlp, foundational]
rating: 8
---

The process of converting raw text into a sequence of integer IDs that a [[Transformer]] (or any neural language model) can process. Sits at the boundary between the human-readable world and the model's vector space.

## Why not characters or words?

- **Characters** — vocabulary is small (100s) but sequences become very long, hurting attention's O(n²) cost
- **Words** — sequences are short, but vocabulary is unbounded (every misspelling, name, language is a new word) and most words appear rarely

Subword tokenization splits the difference: common words become single tokens, rare words decompose into smaller pieces, no out-of-vocabulary failures.

## Common algorithms

- **BPE (Byte Pair Encoding)** — start with characters, repeatedly merge the most frequent adjacent pair until you hit the target vocab size. Used by GPT-2, Llama, most modern LLMs.
- **Byte-level BPE** — operate on raw bytes rather than Unicode characters. Handles any input (including emoji, code, non-Latin scripts) without pre-processing. Used by GPT-3+, Claude.
- **WordPiece** — similar to BPE but uses likelihood rather than frequency for merge decisions. Used by BERT.
- **SentencePiece** — language-agnostic; treats input as a raw byte stream including whitespace. Used by Llama, T5, Gemma.
- **Tiktoken** — OpenAI's optimised BPE implementation. Public encodings: `cl100k_base` (GPT-4), `o200k_base` (GPT-4o).

## Practical consequences

- **Token counts ≠ word counts.** English averages ~1.3 tokens per word; code, JSON, and non-English text are often much higher.
- **The same string can tokenise differently depending on context.** "California" might be one token; " California" (with leading space) is a different one.
- **Numbers tokenise weirdly.** Long numbers split into chunks (e.g. `1234567` → `12`, `34`, `56`, `7`), which is part of why models struggle with arithmetic.
- **Vocab size affects model size.** Modern LLMs use 32K–256K tokens; the embedding and output projection matrices scale linearly with this.

## See also

- [[Transformer]]
- [[KV Cache]] — cache size scales with token count, not character count
