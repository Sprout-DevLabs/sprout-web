---
title: Architecture rules (check)
description: Fail CI when code imports what it shouldn't.
---

```sh
sprout check                          # every rule in .sproutrules, over the whole project
sprout check --diff origin/main...HEAD   # only the files this branch changed
sprout check --json                   # for scripts
```

`sprout check` reads rules from `.sproutrules` at the project root and lists every import that breaks one. It uses the same dependency graph as `impact`, so it works for Go, TypeScript/JavaScript, Python, Rust, Java and Kotlin, and it counts a Go file as depending on another only when it uses a name the other declares.

## Rules

One rule per line, `FROM -> TO`: no file matching `FROM` may depend on a file matching `TO`. Lines starting with `#` are comments.

```
# .sproutrules in kubernetes
# staging repositories are published on their own
staging/ -> pkg/
staging/ -> cmd/
pkg/kubelet/ -> pkg/controller/
# components never import server code
**/*.tsx -> server/
```

Each side is a path from the project root:

| Pattern | Matches |
|---|---|
| `web/` | everything under `web/` |
| `web/*.ts` | `.ts` files directly in `web/` |
| `**/*.tsx` | `.tsx` files anywhere |
| `src/**/internal/` | everything under any `internal/` folder below `src/` |

Test files aren't checked: they ship nowhere, and test fixtures often cross layers. A rule with a side that matches no file is reported, since that's usually a typo.

## Output

```
$ sprout check   # in kubernetes
1 import breaks .sproutrules (9593 files checked)

.sproutrules:4  pkg/kubelet/ -> pkg/controller/
  pkg/kubelet/cm/dra/plugin/dra_plugin_manager.go -> pkg/controller/tainteviction/timed_workers.go  uses timedworkers.CreateWorkerQueue, timedworkers.NewWorkArgs, timedworkers.TimedWorkerQueue +1 more
```

It exits 1 when a rule is broken, 0 when none is, and 2 when `.sproutrules` is missing or a line isn't a rule.

## In CI

To adopt a rule in a project that already breaks it, check only what each pull request changes. The branch's base must be in the checkout, so fetch the history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- uses: actions/setup-go@v5
  with:
    go-version: stable
- run: go install github.com/Sprout-DevLabs/sprout@latest
- run: sprout check --diff origin/${{ github.base_ref }}...HEAD
```

## JSON

```json
{
  "schemaVersion": 1,
  "command": "check",
  "checked": 9593,
  "violations": [
    {"line": 4, "rule": "pkg/kubelet/ -> pkg/controller/", "from": "pkg/kubelet/cm/dra/plugin/dra_plugin_manager.go", "to": "pkg/controller/tainteviction/timed_workers.go", "reason": "uses timedworkers.CreateWorkerQueue, …"}
  ],
  "unmatched": []
}
```

`unmatched` lists the rules with a side that matches no file, and is left out when there are none.
