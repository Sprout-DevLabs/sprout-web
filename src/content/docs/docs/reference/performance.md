---
title: Performance
description: How fast Sprout is on large repositories, and how to measure it.
---

For controlled, versioned before/after measurements (including what didn't improve and how each run was measured), see the [benchmark log](/sprout-web/benchmarks/). The numbers below are a quick reference.

Measured on Kubernetes (31,412 files) on a laptop with a warm cache:

| Command | Time |
|---|---|
| `sprout -L 2` | 0.25 s |
| `sprout` | 0.47 s |
| `find . -type f`, for reference | 0.49 s |
| `sprout --size -L 1` | 0.57 s |
| `sprout --entry` | 1.0 s |
| `sprout --ai` | 1.1 s |

## Why it's fast

- **Only the needed metadata.** A plain tree never reads file sizes or times; they're read only for `--size`, `--sort`, `--changed-within`, `--json`, `--stats`, `--ai` and `--entry`.
- **Parallel parsing.** Source files for the code graph are parsed across all CPU cores.
- **Tests and vendored code are skipped.** They never count toward the ranking, so they're never read.
- **Buffered output.** Printing a 30,000-line tree is one stream, not 30,000 writes.

## Measure it yourself

```sh
git clone --depth 1 https://github.com/kubernetes/kubernetes /tmp/k8s
cd sprout
SPROUT_BENCH_DIR=/tmp/k8s go test -run '^$' -bench .
```
