---
title: AI context (--ai)
description: A compact, token-budgeted project map with key signatures for LLM prompts and coding agents.
---

```sh
sprout --ai | pbcopy            # macOS
sprout --ai | xclip -sel c      # Linux
sprout --ai --budget 800        # a smaller map
```

`--ai` prints a plain-text overview of the project for a prompt or an agent. From top to bottom:

- **Summary**: the README's first prose line
- **stack** and **languages**, from manifests and file counts
- **git**: the branch, uncommitted changes, and the 5 most-changed files in the last 90 days
- **entry points** and **config** (Dockerfiles, CI workflows, compose files, `tsconfig.json` and similar)
- **structure**: one line per folder, with its files inline
- **key files**: the files the rest of the code uses most, with their function and type signatures

```
## key files (most used first)
web/src/lib/types.ts (used by 5): export interface Trail; export interface Report; export type Units
web/src/lib/api.ts (used by 4): export async function getTrail(id: string): Promise<Trail>; …
internal/trails/store.go (used by 3): type Store struct; func NewStore(db *sql.DB) *Store; …
```

## How the budget works

`--budget` is an approximate token count (default 2000, estimated at about 4 bytes per token).

1. The structure gets three fifths of the budget. Every top-level folder starts as a one-line summary, like `internal/ (84 files, mostly .go)`.
2. Folders then open breadth-first while the map still fits. `examples/`, `test/`, `tests/`, `testdata/`, `fixtures/`, `vendor/` and `third_party/` open last, and a folder too big to open doesn't block smaller ones.
3. Key files get the rest of the budget, including anything the structure didn't use.

## How key files are ranked

Sprout reads source files, extracts top-level declarations with their signatures, and resolves local imports. Files are ranked by how many other files import or reference them. Tests don't count, and aren't read for this at all.

| Language | Declarations | References |
|---|---|---|
| Go | Go's own parser: exported names first, then unexported | Module imports, and uses of names from the same package |
| TypeScript, JavaScript | `export`ed functions, classes, types, interfaces, enums and constants | Relative `import`, `export … from`, `require` and `import()`. `./x.js` finds `x.ts` |
| Python | Top-level `def` and `class`, not `_private` | Relative, dotted and `src/` imports, including `from . import a, b` |
| Rust | `pub` items | `mod x;` and `use crate::…` |
| Java, Kotlin | Public types and top-level declarations | `import` under any source root |

Files over 512 KB and binaries are skipped.

:::note[What leaves your machine]
Nothing. `--ai` only prints text. The map contains file and folder names, the README's first line and declaration signatures, never function bodies or other file contents. You decide where the output goes.
:::

:::caution[Known limits]
TypeScript path aliases (`@/…`) aren't resolved yet, and declarations written in unusual formatting can be missed.
:::
