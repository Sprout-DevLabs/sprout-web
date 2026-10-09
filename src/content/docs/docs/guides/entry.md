---
title: Reading order (--entry)
description: Where to start reading an unfamiliar codebase, and why.
---

```sh
sprout --entry
sprout github.com/charmbracelet/bubbletea --entry
```

```
Reading order for trailhead

  1. README.md                  what the project is
  2. cmd/api/main.go            entry point
  3. web/src/main.tsx           entry point
  4. web/src/lib/types.ts       used by 5 files
  5. web/src/lib/api.ts         used by 4 files
```

The order is:

1. The README.
2. Entry points: `main.go`, `index.ts`, `app.py`, `main.rs` and similar, outside tests and examples.
3. The files the rest of the code uses most, from the same ranking as [`--ai`'s key files](/sprout-web/docs/guides/ai/#how-key-files-are-ranked).

The list stops at 15 steps. Each step says why it's there.

It's also available to agents as the `reading_order` [MCP tool](/sprout-web/docs/guides/mcp/).

For the README's pitch, the layout and what to run next around this list, use [`sprout tour`](/sprout-web/docs/guides/tour/).
