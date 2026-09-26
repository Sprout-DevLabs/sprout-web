---
title: All flags
description: Every sprout flag, grouped by what it does.
---

`sprout [path | repository-url] [flags]`, or `sprout mcp [root]`. Flags can come before or after the path.

## Filtering

| Flag | Description |
|---|---|
| `-L`, `--depth N` | Limit depth. `-1`, the default, means unlimited |
| `-a`, `--all` | Show hidden and ignored entries |
| `--hidden` | Show dotfiles |
| `--no-ignore` | Skip `.gitignore`, `.sproutignore` and the built-in list |
| `--ignore PATTERNS` | Hide matches, in gitignore syntax |
| `--only PATTERNS` | Show only matching files |
| `--changed-within AGE` | Only files modified recently: `30m`, `12h`, `7d`, `2w` |
| `--max-files N` | At most N files per folder |

## Sizes and order

| Flag | Description |
|---|---|
| `--size` | File sizes and true folder totals |
| `--sort name\|size\|time` | Order entries |
| `-r`, `--reverse` | Reverse the order |
| `--dirs-first` | Folders before files |
| `--si` | Sizes in powers of 1000 |

## Views

| Flag | Description |
|---|---|
| `--ai` | Project map for LLMs |
| `--budget N` | Token budget for `--ai` (default 2000) |
| `--entry` | Suggested reading order |
| `--diff REV` | Only paths changed in a revision range |
| `--git` | Mark uncommitted changes |
| `--churn` | Commits per path |
| `--since DATE` | Window for `--churn` |
| `--stats` | Summary statistics |
| `--json` | JSON output |

## Output and setup

| Flag | Description |
|---|---|
| `--hyperlink` | Clickable names in supporting terminals |
| `--no-config` | Ignore config files |
| `--completion SHELL` | Print a completion script: `bash`, `zsh`, `fish`, `powershell` |
| `--man` | Print the man page |
| `--version` | Print the version |
| `-h`, `--help` | Print usage |
