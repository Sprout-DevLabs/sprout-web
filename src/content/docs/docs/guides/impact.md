---
title: Impact of a change (impact)
description: What a change could break, and the tests to run.
---

```sh
sprout impact                      # your uncommitted changes, untracked files included
sprout impact --staged             # what you're about to commit
sprout impact --diff main...HEAD   # everything on this branch
sprout impact --commit HEAD        # one commit
sprout impact src/a.ts src/b.ts    # these files
```

`sprout impact` follows a change through every file that depends on it, directly or through others, and collects every test that reaches it.

```
$ sprout impact app/crud.py
Impact of 1 changed file (files)

  app/crud.py

Affected: 10 files, 3 directly
  app/api/routes/login.py  imports app.crud
  app/api/routes/users.py  imports app.crud
  app/core/db.py           imports app.crud
  … and 7 more files through them (--all lists them)

Tests: 7 files
  tests/api/routes/test_items.py
  tests/api/routes/test_login.py
  tests/api/routes/test_users.py
  tests/conftest.py
  tests/crud/test_user.py
  tests/utils/item.py
  tests/utils/user.py
```

Direct dependents come with the reason; the files reached through them are summarised, and `--all` lists them with the file each was reached through. For Go, the tests are given as a `go test` command you can run as is.

Files that aren't source code (docs, configs) are listed as not traced. Deleted files are listed too, but what imported them can't be traced from the files that are left.

| Flag | Does |
|---|---|
| `--staged` | The staged changes |
| `--diff REV` | The changes in a revision range, e.g. `main...HEAD` |
| `--commit REV` | The changes in one commit |
| `--depth N` | Hops of dependents to follow (default `-1`, all) |
| `--all` | List every affected file |
| `--json` | `schemaVersion: 1` output: `changed`, `affected` (with `depth`, `via`, `reason`, `test`), `tests`, `goTestPackages`, `notInGraph`, `deleted` |

## In CI

`--json` gives a pull request's blast radius in one call:

```sh
sprout impact --diff origin/main...HEAD --json | jq -r '.goTestPackages[]' | xargs go test
```

Agents get it as the `impact` [MCP tool](/sprout-web/docs/guides/mcp/), which tells them to call it after editing, before running tests or opening a pull request.
