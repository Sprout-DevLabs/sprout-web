---
title: Config files
description: Set default flags for yourself or for a project.
---

Put default flags in a config file, one per line:

```sh
# ~/.config/sprout/config
--hyperlink
--ignore=*.snap,fixtures/
--budget 4000
```

## Where Sprout looks

Files are read in this order, and later ones win:

1. **User:** `$SPROUT_CONFIG`, else `$XDG_CONFIG_HOME/sprout/config`, else `~/.config/sprout/config`. On Windows it's `%AppData%\sprout\config`.
2. **Project:** the nearest `.sproutrc` in the target directory or above it.
3. **The command line**, which always wins. Turn a boolean off with `--git=false`.

`--ignore` and `--only` patterns add up across all three rather than replacing each other.

## Rules

- One flag per line: `--depth 3` or `--depth=3`. Lines starting with `#` are comments.
- Config files can only set flags, not a path.
- A mistake names the file and line: `.sproutrc:1: expected a flag like --depth 3`.
- `--no-config` skips both files for one run.
- When you map a [remote repository](/sprout-web/docs/guides/remote/), its `.sproutrc` is ignored.

## .sproutignore

`.sproutignore` isn't a config file. It holds extra [gitignore-style patterns](/sprout-web/docs/guides/tree/#filtering) for the directory it's in, and applies on every run.
