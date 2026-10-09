---
title: Guided tour (tour)
description: "A first-day overview of a codebase: what it is, how it's laid out, and what to read first."
---

:::note
`sprout tour` is on `main` and ships in the next release. Until then:
`go install github.com/Sprout-DevLabs/sprout@main`.
:::

```sh
sprout tour                     # the current folder
sprout tour ./project --limit 12
sprout tour --json
```

`sprout tour` is [`--entry`](/sprout-web/docs/guides/entry/) with the context a new teammate needs around it: the README's opening line, the ecosystems and languages, the top-level layout, why each file is on the reading list, and what to run next.

```
$ sprout tour express --limit 6
Tour of express

Purpose (Readme.md excerpt): Fast, unopinionated, minimalist web framework for Node.js.
214 files, 68 directories (1 entry ignored or skipped)
Ecosystem: JavaScript/TypeScript (package.json; npm)
Languages: JavaScript 85%, HTML 5%, YAML 4%, CSS 2%, Markdown 2%, JSON 1%

Layout (top-level directories):
  examples/ (80 files)
  lib/ (6 files)
  test/ (112 files)

Start here:
  1. Readme.md — project overview (README)
  2. index.js — likely entry point (filename convention)
  3. lib/utils.js — used by 2 files
  4. lib/application.js — used by 1 file
  5. lib/express.js — used by 1 file
  6. lib/request.js — used by 1 file
  +2 reading candidates omitted; raise --limit (maximum 50).

Next (run from the directory you toured; POSIX shell or PowerShell):
  sprout context './index.js'
  sprout --ai
  sprout -L 2

Note: suggestions are heuristics from static analysis, not runtime behavior.
```

## What's in it

- **Purpose**: the first line of prose in the README, as plain text. Headings, badges and HTML are skipped. If there's no README, or no prose in it, the tour says so rather than guessing.
- **Ecosystems**: from manifests at the root (`go.mod`, `package.json`, `pyproject.toml`, `Cargo.toml`…). They name the language and package manager, not the framework.
- **Layout**: the top-level folders and how many files each holds. Hidden folders like `.github` are left out.
- **Start here**: the README, then likely entry points by file name, then the files the rest of the code uses most. The ranking is the same as `--entry`'s, with tests, examples and vendored code left out.
- **Next**: [`sprout context`](/sprout-web/docs/guides/context/) for the first file on the list, then the AI map and a two-level tree. They're quoted so you can paste them into a POSIX shell or PowerShell. The tour never runs them.

`--limit N` (default 8, 1–50) sets how many reading steps and folders are shown. Anything left out is counted, never dropped silently. It limits the output, not the analysis.

## Safe on code you don't trust

The tour reads files and runs `git ls-files`; it never runs the project's code. It respects `.gitignore` and `.sproutignore`, skips symlinks and special files, and turns off git's `fsmonitor` hook so a repository can't make git run anything. Terminal control characters in file names and README text are replaced before printing.

Unlike the tree, it works on local folders only, and doesn't read your [config files](/sprout-web/docs/guides/config/). To map a folder named `tour`, write `sprout ./tour`.

## JSON

`--json` prints one object with `schemaVersion: 1`: `purpose`, `projects`, `languages`, `files`, `directories`, `skipped`, `layout`, `readingOrder` (each step a `{path, reason}`), `omittedLayout`, `omittedReading`, `nextCommands` (each an argument list) and `caveats`. Paths are relative and use `/`. The output is the same on every run of an unchanged folder, and never includes the absolute path. The full contract is in [`docs/tour-json.md`](https://github.com/Sprout-DevLabs/sprout/blob/main/docs/tour-json.md).
