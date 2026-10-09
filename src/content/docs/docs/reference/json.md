---
title: JSON output
description: The --json schema for scripts, CI and PR bots.
---

`--json` prints the tree, the detected projects and a summary as one document. It combines with every other flag, so `sprout --diff main...HEAD --json` or `sprout --churn --json` work as you'd expect.

```json
{
  "schemaVersion": 1,
  "name": "demo",
  "root": "/home/you/demo",
  "gitAware": true,
  "projects": [{ "manifest": "go.mod", "language": "Go", "packageManager": "go modules" }],
  "summary": { "directories": 1, "files": 2, "bytes": 30, "skipped": 1, "languages": { "Go": 1 } },
  "tree": {
    "name": "demo",
    "type": "directory",
    "children": [
      { "name": "go.mod", "path": "go.mod", "type": "file", "size": 12, "modified": "2026-09-20T10:00:00Z" },
      {
        "name": "src", "path": "src", "type": "directory", "changes": 1,
        "children": [{ "name": "main.go", "path": "src/main.go", "type": "file", "size": 18, "status": "M" }]
      }
    ]
  }
}
```

## Node fields

| Field | Notes |
|---|---|
| `name`, `path`, `type` | `path` is relative to the root and always uses `/`. `type` is `"file"` or `"directory"` |
| `size`, `modified` | Bytes, and an RFC 3339 UTC time. Folders get a total with `--size`, and their newest file's time |
| `truncated` | A folder collapsed by `--depth` |
| `moreFiles` | Files left out by `--max-files` |
| `error` | A folder that couldn't be read, e.g. `"permission denied"`. The walk carries on past it |
| `status`, `changes` | From `--git` or `--diff` |
| `added`, `deleted` | `--diff` line counts, summed on folders |
| `churn` | `--churn` commit count |

Empty fields are left out, and `projects` is always an array.

## Commands

Each command's `--json` has its own `schemaVersion` and a `command` field, and is documented with the command:

| Command | Fields |
|---|---|
| [`tour`](/sprout-web/docs/guides/tour/#json) | `purpose`, `projects`, `layout`, `readingOrder`, `nextCommands`, `caveats`… |
| [`deps`, `dependents`](/sprout-web/docs/guides/deps/) | each linked file with its reason |
| [`impact`](/sprout-web/docs/guides/impact/) | `changed`, `affected`, `tests`, `goTestPackages`… |
| [`context`](/sprout-web/docs/guides/context/#json) | `dependencies`, `users`, `tests`, `declarations` |

## Stability

`schemaVersion` only changes when an existing field changes meaning or is removed. New fields can appear in any release, so scripts should ignore fields they don't know.
