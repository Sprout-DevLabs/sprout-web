---
title: FAQ
description: Common questions about Sprout.
---

## Does `--ai` send my code anywhere?

No. Sprout makes no network requests except when it clones a repository you asked it to map. `--ai` prints text, and you decide where it goes. The map holds names and declaration signatures, never function bodies.

## How is this different from `tree`?

For a plain listing it's similar on purpose: `sprout -L 2` works the way you'd expect. The differences are:

- **The defaults.** `.gitignore` is respected, and everything hidden is counted.
- **The views `tree` doesn't have.** `--ai`, `--entry`, `--diff`, `--git`, `--churn`, remote repositories and MCP.

## Why are there no colors?

Colors and links only appear when output goes to a terminal. `NO_COLOR` or `TERM=dumb` turns colors off.

## I have a directory called `mcp`

`sprout mcp` starts the MCP server. Use `sprout ./mcp` to see the directory.

## Why is a file missing from the tree?

It's probably ignored by `.gitignore`, or it's a dotfile. The summary line says how many entries were hidden, and `sprout -a` shows everything.

## Found a bug?

[Open an issue](https://github.com/Sprout-DevLabs/sprout/issues) and include `sprout --version`.
