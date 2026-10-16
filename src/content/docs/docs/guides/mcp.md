---
title: MCP for coding agents
description: Run Sprout as a Model Context Protocol server for Claude Code, Cursor and other agents.
---

`sprout mcp [root]` speaks the [Model Context Protocol](https://modelcontextprotocol.io) over stdio. Agents get a map of the project in one call, instead of spending their context on `ls -R`, `grep` and reading files one by one.

## Set it up

Sprout can print the setup for your client with its own full path filled in:

```sh
sprout mcp --print-config claude-code     # or cursor, vscode, claude-desktop
```

Or copy it from here.

**Claude Code**, in your project:

```sh
claude mcp add sprout -- sprout mcp
```

**Cursor**: `.cursor/mcp.json` in your project, or `~/.cursor/mcp.json` for every project. Cursor fills in `${workspaceFolder}`:

```json
{ "mcpServers": { "sprout": { "command": "sprout", "args": ["mcp", "${workspaceFolder}"] } } }
```

**VS Code**: `.vscode/mcp.json` in your project. The top-level key is `servers`, not `mcpServers`:

```json
{ "servers": { "sprout": { "type": "stdio", "command": "sprout", "args": ["mcp", "${workspaceFolder}"] } } }
```

**Claude Desktop**: Settings → Developer → Edit Config opens `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, or `%APPDATA%\Claude\claude_desktop_config.json` on Windows. Desktop apps don't know your project, and often can't find Homebrew's binaries, so give both in full. `which sprout` prints the first:

```json
{ "mcpServers": { "sprout": { "command": "/opt/homebrew/bin/sprout", "args": ["mcp", "/path/to/your/project"] } } }
```

Restart the client after editing its config.

## Which folder it serves

1. The folder you pass: `sprout mcp /path/to/project`.
2. Otherwise, the folder your client says is open, if it supports MCP *roots* (VS Code and Claude Code do). When the client says it changed, the server follows.
3. Otherwise, the folder it was started in.

In `/` or your home folder, whether the server started there or the client is open there (Claude Code launched from `~`, say), the tools refuse and say how to fix it, instead of mapping hundreds of thousands of files, private ones included. Start the agent inside the project, or pass the project path. Pass the home folder explicitly if you really mean it.

Any single call can also name its project with `root`, an absolute path. The agent can then work on a repository other than the open folder, even while that folder is refused.

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `project_map` | `path?`, `budget?` | The [`--ai`](/sprout-web/docs/guides/ai/) map with key files. Its description tells agents to call it first |
| `reading_order` | `path?` | The [`--entry`](/sprout-web/docs/guides/entry/) list |
| `tree` | `path?`, `depth?` (default 3), `all?`, `git?`, `churn?`, `since?` | A tree of a folder |
| `diff_tree` | `rev`, `path?`, `depth?` | The [`--diff`](/sprout-web/docs/guides/git/#diff-a-pull-request-as-a-tree) view |
| `dependents` | `file`, `depth?`, `noTests?` | What depends on a file, and why ([`dependents`](/sprout-web/docs/guides/deps/)) |
| `deps` | `file`, `depth?` | What a file depends on, and why |
| `impact` | `files?` or `staged?`, `rev?`, `commit?`; `all?` | What a change could break, and the tests to run ([`impact`](/sprout-web/docs/guides/impact/)). Uncommitted changes by default |
| `context` | `file`, `budget?` | What to know before editing a file ([`context`](/sprout-web/docs/guides/context/)) |

Every tool also takes `root?`, the project's absolute path, for that call only.

The tool descriptions tell agents when to reach for each: `project_map` first in a new repository, `context` or `dependents` before editing a file, `impact` after editing.

## Safety

An agent's arguments are untrusted input, so:

- `path`, `file` and `files` must stay inside the root once `..` and symlinks are resolved. Absolute paths and URLs are refused, so the server never clones anything.
- `root` must be an absolute path to a project folder (one with `.git` or a manifest like `go.mod` or `package.json`). It can't be a hidden folder, `/` or your home folder, and if you gave the server a folder, it must be inside that folder.
- `rev` and `commit` can't become git options.
- Output uses paths relative to the root. The one exception: when a file isn't found, the error names the folder being served, because a wrong folder is the usual cause.
- The server is read-only.

## If it doesn't work

- **No sprout tools show up:** restart the client. Then run `sprout mcp` in a terminal: it should print `MCP server on stdio, root …` and wait. If the client's MCP log says the command wasn't found, it can't see your `PATH`: use the full path from `which sprout`.
- **The map is of the wrong folder:** start the agent inside the project, or pass the project path as in the examples above. When a file isn't found, the error says which folder the server is on.
- **The agent doesn't use the tools:** the server tells agents when each tool beats searching by hand, but asking helps: "use sprout's impact tool on what you changed".
- **Stale answers:** there aren't any. Every call reads the disk again, so files your agent just wrote are in the next answer.
