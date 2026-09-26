---
title: Remote repositories
description: Map any git repository without cloning it yourself.
---

```sh
sprout github.com/charmbracelet/bubbletea --ai
sprout https://gitlab.com/group/project --entry
sprout git@github.com:acme/private.git --churn -L 2
```

Sprout clones the repository into a temporary folder, maps it, and deletes the folder, even if you press Ctrl-C. It accepts:

- `https://`, `ssh://`, `git://` and `file://` URLs
- `git@host:owner/repo`
- `host/owner/repo` shorthand, like `github.com/owner/repo`

A path that exists on disk is always treated as local, so a folder named `github.com/…` is never cloned by accident.

## What gets downloaded

By default Sprout fetches only the latest commit, which is enough for the tree, `--ai` and `--entry`. With `--git`, `--churn` or `--diff` it fetches the full history but not old file contents (`--filter=blob:none`), so hotspots and diffs work without downloading every past version of every file.

## Private repositories

Sprout uses your normal git credentials: ssh keys, credential helpers or a token in your git config. git may prompt you if it needs to.

## Safety

- The URL is passed to git after `--`, so it can't be read as an option.
- A cloned repository's own `.sproutrc` is **ignored**. Only your user config applies.
- The [MCP server](/sprout-web/docs/guides/mcp/) never clones anything.
