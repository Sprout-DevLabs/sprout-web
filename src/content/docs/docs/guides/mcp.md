---
title: MCP for coding agents
description: Run Sprout as a Model Context Protocol server for Claude Code, Cursor and other agents.
---

`sprout mcp [root]` speaks the [Model Context Protocol](https://modelcontextprotocol.io) over stdio. Agents get a map of the project in one call, instead of spending their context on `ls -R`, `grep` and reading files one by one. The root defaults to the directory the server starts in.

## Set it up

**Claude Code**

```sh
claude mcp add sprout -- sprout mcp
```

**Cursor, Claude Desktop and other clients**

```json
{
  "mcpServers": {
    "sprout": { "command": "sprout", "args": ["mcp"] }
  }
}
```

If your client doesn't start servers in the project directory, pass the path: `"args": ["mcp", "/path/to/project"]`.

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `project_map` | `path?`, `budget?` | The [`--ai`](/sprout-web/docs/guides/ai/) map with key files. Its description tells agents to call it first |
| `reading_order` | `path?` | The [`--entry`](/sprout-web/docs/guides/entry/) list |
| `tree` | `path?`, `depth?` (default 3), `all?`, `git?`, `churn?`, `since?` | A tree of a folder |
| `diff_tree` | `rev`, `path?`, `depth?` | The [`--diff`](/sprout-web/docs/guides/git/#--diff-a-pull-request-as-a-tree) view |

## Safety

An agent's arguments are untrusted input, so:

- `path` must stay inside the root once `..` and symlinks are resolved. Absolute paths and URLs are refused, so the server never clones anything.
- `rev` can't become a git option.
- Output uses paths relative to the root, never your home directory.
- The server is read-only.
