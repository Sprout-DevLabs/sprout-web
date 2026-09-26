---
title: Git, diffs and hotspots
description: Mark uncommitted changes, show a revision range as a tree, and find where work concentrates.
---

## --git: uncommitted changes

```sh
sprout --git -L 2
```

| Mark | Meaning |
|---|---|
| `M` | Modified |
| `A` | Added (staged) |
| `D` | Deleted, shown where the file used to be |
| `R` | Renamed |
| `?` | Untracked |
| `U` | Merge conflict |

Folders show `(N changed)`, so changes stay visible even when `-L` collapses a folder. The header shows the current branch. It works from any subdirectory of a repository.

## --diff: a pull request as a tree

```sh
sprout --diff main...HEAD         # what this branch changed since it forked
sprout --diff HEAD~3              # the last three commits plus uncommitted changes
sprout --diff v1.0..v1.1 -L 2     # between tags, collapsed to depth 2
```

```
. main...HEAD
├── internal/  (4 changed)  +156 -0
│   └── tiles/  (4 changed)  +156 -0
│       ├── cache.go  M  +38 -0
│       ├── prefetch.go  A  +64 -0
│       └── render.go  M  +12 -0
└── web/  (6 changed)  +187 -5

11 files changed, +352 -5
```

It shows only the changed paths, with `M A D R` marks and `+/-` line counts. Folders show how many files changed below them, plus their totals, and `-L` collapses deeper folders into those totals.

Any revision git accepts works. A value starting with `-` is refused, so it can't be read as a git option. With `--json` it feeds a PR bot directly.

## --churn: hotspots

```sh
sprout --churn
sprout --churn --since '90 days ago'
sprout --churn --git -L 2
```

Each path shows the number of commits that touched it, with a bar. Files are scaled against the busiest file, and folders against the busiest folder. High counts turn yellow, then red. `--since` takes any date git understands, which also keeps very large histories quick.
