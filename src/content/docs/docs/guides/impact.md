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
sprout impact store.go --symbol Save   # only what uses one Go function, type or variable
```

`sprout impact` follows a change through every file that depends on it, directly or through others, and collects every test that reaches it. It works on a local checkout: for a repository you haven't cloned, [`tour`, `--ai` and `--entry`](/sprout-web/docs/guides/remote/) work on the URL, and `impact` needs `git clone` first.

```
$ sprout impact backend/app/crud.py   # in fastapi-template
Impact of 1 file

  backend/app/crud.py

Affected: 10 files, 3 directly
  backend/app/api/routes/login.py  imports app.crud
  backend/app/api/routes/users.py  imports app.crud
  backend/app/core/db.py           imports app.crud
  … and 7 more files through them (--all lists them)

Tests: 4 files
  in backend/:
    python -m pytest tests/api/routes/test_items.py tests/api/routes/test_login.py tests/api/routes/test_users.py tests/crud/test_user.py
```

Direct dependents come with the reason; the files reached through them are summarised, and `--all` lists them with the file each was reached through. The tests come as a command you can run as is: `go test` for Go, `pytest` for Python, and `vitest`, `jest`, `ava` or `mocha` for TypeScript and JavaScript when the project uses one. Test helpers such as `conftest.py` are followed, so tests reached through them count, but they aren't listed as tests to run.

## Go: only the tests that reach the change

In a Go package, nearly every file reaches every other, so following files alone would run every test. Sprout also follows the change function by function within its package, and when that's under half of the package's tests, `go test` gets a `-run` with just those.

For one function, method, type or variable, add `--symbol`: only the code and tests that use it, directly or through other functions.

```
$ sprout impact command.go --symbol SetContext   # in cobra
Impact of SetContext

  command.go

Affected: 0 files

Tests: 1 file, 1 Go package
  go test . -run '^(TestSetContext|TestSetContextPersistentPreRun|TestSetContextPreRun|TestSetContextPreRunOverwrite)$'
```

That's 4 of cobra's 260 tests. Matching is by name, so a method with the same name on another type counts too; that errs towards running more tests, not fewer.

Files that aren't source code (docs, configs) are listed as not traced. Deleted files are listed too, but what imported them can't be traced from the files that are left.

| Flag | Does |
|---|---|
| `--staged` | The staged changes |
| `--diff REV` | The changes in a revision range, e.g. `main...HEAD` |
| `--commit REV` | The changes in one commit |
| `--depth N` | Hops of dependents to follow (default `-1`, all) |
| `--all` | List every affected file |
| `--symbol NAME` | With one Go file: only what uses this function, method, type or variable |
| `--json` | `schemaVersion: 1` output: `changed`, `affected` (with `depth`, `via`, `reason`, `test`), `tests`, `goTestPackages`, `goTestRun` (the tests for `-run`, by package, where it narrows them), `testCommands`, `symbol`, `notInGraph`, `deleted` |

## In CI

`--json` gives a pull request's blast radius in one call:

```sh
sprout impact --diff origin/main...HEAD --json | jq -r '.goTestPackages[]' | xargs go test
```

Agents get it as the `impact` [MCP tool](/sprout-web/docs/guides/mcp/), which tells them to call it after editing, before running tests or opening a pull request.
