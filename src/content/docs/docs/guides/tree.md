---
title: The tree
description: What Sprout shows and hides, filtering with gitignore patterns, sizes, sorting and more.
---

```sh
sprout                     # current directory
sprout src -L 2            # flags go before or after the path
sprout -a                  # everything, hidden and ignored entries included
```

The tree ends with a summary line, like `tree`'s. It also counts anything Sprout hid:

```
15 directories, 15 files (4 hidden or ignored, --all to show)
```

## What gets hidden

**Inside a git repository**, `.gitignore` decides. Sprout asks git for the tracked files plus the untracked files that aren't ignored. Nested `.gitignore` files, negations and your global excludes all behave exactly as they do in git.

**Outside git**, Sprout hides common build and dependency folders instead: `node_modules`, `dist`, `build`, `target`, `obj`, `coverage`, `.venv`, `venv`, `__pycache__`, `.cache`, `.next`, `.nuxt`, `.pytest_cache`, `.mypy_cache`, `.idea`, `.vscode`, `.DS_Store` and `*.egg-info`.

In both cases dotfiles are hidden and `.git` is never shown.

| Flag | Effect |
|---|---|
| `--hidden` | Show dotfiles |
| `--no-ignore` | Skip `.gitignore`, `.sproutignore` and the built-in list |
| `-a`, `--all` | Both of the above |

## Filtering

`--ignore`, `--only` and `.sproutignore` all use **gitignore syntax**. The flags can be repeated or comma-separated.

| Pattern | Matches |
|---|---|
| `*.log` | Any `.log` file at any depth (no slash means match the name) |
| `src/gen` | Exactly `src/gen`, from the root (a slash anchors it) |
| `build/` | Directories named `build` only |
| `docs/**/*.png` | PNGs anywhere under `docs` (`**` crosses folders) |
| `!keep.log` | Brings back something an earlier pattern hid (the last match wins) |

```sh
sprout --only '*.go' --ignore '*_test.go'     # Go sources, no tests
sprout --only 'web/src/**/*.tsx'               # one part of a frontend
sprout --changed-within 2d                     # files modified in the last two days
sprout --max-files 5                           # at most 5 files per folder, then "… 37 more files"
```

- `--only` removes folders it leaves empty.
- `--changed-within` accepts `30m`, `12h`, `7d`, `2w` or any Go duration.
- A `.sproutignore` in the target directory applies its patterns on every run.

Everything these hide is counted in the summary line.

## Sizes and sorting

```sh
sprout --size -L 1                   # folder totals, du-style
sprout --size --sort size -L 2       # largest first
sprout --sort time -r                # oldest first
sprout --dirs-first --size --si      # folders first, powers of 1000
```

Folder totals are **true totals**. When `-L` collapses a folder, Sprout still measures everything inside it without listing it. Sorting by size or time works the same way, so a collapsed folder sorts by what it contains.

Sizes are shown `du -h` style (`4.2K`, `1.3M`) in powers of 1024, or powers of 1000 with `--si`.

## Clickable names

`--hyperlink` makes each name a link to the file in terminals that support OSC 8, such as iTerm2, WezTerm, Kitty, GNOME Terminal and Windows Terminal. Links are only written when output goes to a terminal. Add `--hyperlink` to your [config](/sprout-web/docs/guides/config/) to always have them.

## Colors

Directories, change marks and hotspots are colored when output goes to a terminal. Pipes and files get plain text, and `NO_COLOR` or `TERM=dumb` turns color off.
