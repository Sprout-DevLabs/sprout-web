---
title: Completions, man page, exit codes
description: Shell completions, the man page, environment variables and exit codes.
---

## Shell completions

Homebrew and the Linux packages install these for you. Otherwise:

```sh
sprout --completion bash > ~/.local/share/bash-completion/completions/sprout
sprout --completion zsh  > "${fpath[1]}/_sprout"
sprout --completion fish > ~/.config/fish/completions/sprout.fish
sprout --completion powershell >> $PROFILE
```

Completions cover every flag, the `--sort` values, git branches and tags for `--diff`, and folders for the path. They're generated from the same definitions the binary parses, so they can't go out of date.

## Man page

```sh
man sprout                 # Homebrew and Linux packages
sprout --man | man -l -    # anywhere else on Linux
```

## Environment

| Variable | Effect |
|---|---|
| `NO_COLOR` | Turn colors off |
| `SPROUT_CONFIG` | Path of the user config file |
| `XDG_CONFIG_HOME` | Where the user config lives if `SPROUT_CONFIG` isn't set |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Runtime error: missing path, not a git repository, failed clone |
| `2` | Invalid flags, arguments or config |
