---
title: Dependencies (deps, dependents)
description: What a file depends on, what depends on it, and why.
---

```sh
sprout deps FILE         # what FILE depends on
sprout dependents FILE   # what depends on FILE, tests included
```

Each line says why the link is there. For Go that's the names a file actually uses from the other (`uses auth.Session, auth.Verify`); for other languages, the import that resolved to it.

```
$ sprout deps app/api/routes/items.py
app/api/routes/items.py depends on 2 files

  app/api/deps.py  imports app.api.deps
  app/models.py    imports app.models
```

## Following more hops

`--depth N` follows the chain further, `-1` all the way. Each file is listed once, at its shortest distance, with the file it was reached through:

```
$ sprout dependents app/crud.py --depth 2
13 files (7 tests) depend on app/crud.py

  app/api/routes/login.py         imports app.crud
  app/api/routes/users.py         imports app.crud
  app/core/db.py                  imports app.crud
  tests/api/routes/test_login.py  test · imports app.crud
  tests/api/routes/test_users.py  test · imports app.crud
  tests/crud/test_user.py         test · imports app.crud
  tests/utils/item.py             test · imports app.crud
  tests/utils/user.py             test · imports app.crud
  app/api/deps.py                 via app/core/db.py · imports app.core.db
  app/api/main.py                 via app/api/routes/login.py · imports app.api.routes.login
  app/initial_data.py             via app/core/db.py · imports app.core.db
  tests/api/routes/test_items.py  test · via tests/utils/item.py · imports tests.utils.item
```

| Flag | Does |
|---|---|
| `--depth N` | Hops to follow (default 1, `-1` for all) |
| `--no-tests` | Leave test files out |
| `--json` | `schemaVersion: 1` output for scripts |

The project root is the nearest folder above the file with a `.git`, so the commands work from anywhere in the repository.

## What's a dependency

The same graph behind [`--entry`](/sprout-web/docs/guides/entry/) and [`--ai`](/sprout-web/docs/guides/ai/):

- **Go**: imports resolved through every `go.mod` in the tree, down to the file that declares what's used.
- **TypeScript and JavaScript**: relative imports, `tsconfig`/`jsconfig` `paths` and `baseUrl` (following `extends`), and packages of the same workspace through their `package.json` `exports`.
- **Python**: imports from the folders Python would search, including apps rooted in a subfolder and `src/` layouts; `from pkg import module` links the module.
- **Rust**: each crate's modules from its `Cargo.toml`, `use` trees, `crate::`, `self::`, `super::` and other crates of the workspace.
- **Java and Kotlin**: imports matched to files under any source root.

How accurate that is gets measured against each language's own tooling: see [Graph accuracy](https://github.com/Sprout-DevLabs/sprout/tree/main/tools/accuracy).

A folder named `deps` or `dependents` is mapped with `./deps`, since the bare word is the command.

Agents get both as the `deps` and `dependents` [MCP tools](/sprout-web/docs/guides/mcp/).
