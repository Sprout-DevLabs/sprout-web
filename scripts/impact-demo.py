"""Generate src/data/impact-demo.json, the landing page's impact explorer,
from real Sprout output on the FastAPI template's backend.

    python3 scripts/impact-demo.py SPROUT_BINARY FASTAPI_TEMPLATE_CHECKOUT

The backend is copied into a scratch repository (so paths start at the
backend), every Python file's links come from `sprout deps --json`, and every
file's panel text and counts from `sprout impact`. Files are laid out in
columns by dependency depth, what they build on to the left and tests on the
right, ordered to reduce crossings. Regenerate when Sprout's output changes.
"""

import collections
import json
import os
import shutil
import subprocess
import sys
import tempfile

sprout, checkout = (os.path.abspath(p) for p in sys.argv[1:3])
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "impact-demo.json")
W, H, X0, X1 = 1000, 600, 40, 850
CHAR = 6.7  # Geist Mono at 11px


def run(*args, cwd):
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, check=False).stdout


commit = run("git", "rev-parse", "HEAD", cwd=checkout).strip()
work = tempfile.mkdtemp()
shutil.copytree(os.path.join(checkout, "backend"), os.path.join(work, "backend"))
repo = os.path.join(work, "backend")
for cmd in (["git", "init", "-q"], ["git", "add", "-A"], ["git", "-c", "user.name=x", "-c", "user.email=x@x", "commit", "-qm", "x"]):
    subprocess.run(cmd, cwd=repo, check=True)

files = run("git", "ls-files", "*.py", cwd=repo).split()
edges = set()
for f in files:
    out = run(sprout, "deps", f, "--json", cwd=repo)
    if out:
        edges |= {(f, h["path"]) for h in json.loads(out)["results"]}
linked = collections.Counter(p for e in edges for p in e)
nodes = sorted(f for f in files if linked[f])


def kind(p):
    base = os.path.basename(p)
    if base.startswith("test_") or base.endswith("_test.py"):
        return "test"
    return "helper" if p.startswith("tests/") else "code"


# Columns: what a file builds on sits left of it; tests and helpers last.
deps = collections.defaultdict(set)
for a, b in edges:
    deps[a].add(b)
depth = {}


def layer(n, seen=()):
    if n not in depth:
        ds = [d for d in deps[n] if d not in seen]
        depth[n] = 1 + max((layer(d, seen + (n,)) for d in ds), default=-1)
    return depth[n]


col = {n: layer(n) for n in nodes}
last = max(col[n] for n in nodes if kind(n) == "code") + 1
for n in nodes:
    if kind(n) != "code":
        col[n] = last
cols = collections.defaultdict(list)
for n in nodes:
    cols[col[n]].append(n)
pos = {}
for c in cols:
    cols[c].sort()
    pos.update({n: i for i, n in enumerate(cols[c])})
near = collections.defaultdict(set)
for a, b in edges:
    near[a].add(b)
    near[b].add(a)
for _ in range(12):  # barycenter sweeps to reduce crossings
    for c in sorted(cols):
        cols[c].sort(key=lambda n: sum(pos[m] for m in near[n]) / len(near[n]) if near[n] else pos[n])
        pos.update({n: i for i, n in enumerate(cols[c])})


def label(p):
    """The shortest unique tail of the path, without .py; packages by folder."""
    parts = p[:-3].split("/")
    for k in range(2 if parts[-1] == "__init__" else 1, len(parts) + 1):
        tail = "/".join(parts[-k:])
        if sum(1 for q in nodes if "/".join(q[:-3].split("/")[-k:]) == tail) == 1:
            return tail
    return p


out_nodes = []
for c in sorted(cols):
    x = X0 + (X1 - X0) * sorted(cols).index(c) / (len(cols) - 1)
    for i, n in enumerate(cols[c]):
        y = H / 2 + (i - (len(cols[c]) - 1) / 2) * min(46, (H - 60) / max(1, len(cols[c]) - 1))
        out_nodes.append({"path": n, "label": label(n), "kind": kind(n), "x": round(x, 1), "y": round(y, 1)})
for n in out_nodes:  # a label that would run into the next column's dot sits above its own
    end = n["x"] + 11 + len(n["label"]) * CHAR
    n["above"] = any(m is not n and n["x"] < m["x"] <= end + 6 and abs(m["y"] - n["y"]) < 14 for m in out_nodes)

index = {n["path"]: i for i, n in enumerate(out_nodes)}
impact = {}
for n in out_nodes:
    j = json.loads(run(sprout, "impact", n["path"], "--json", cwd=repo))
    impact[n["path"]] = {
        "text": run(sprout, "impact", n["path"], cwd=repo).rstrip(),
        "affected": sum(1 for a in j["affected"] if not a.get("test")),
        "tests": len(j["tests"]),
    }
version = run(sprout, "--version", cwd=repo).split()[-1]
json.dump({"repo": "fastapi/full-stack-fastapi-template", "folder": "backend", "commit": commit, "sprout": version,
           "nodes": out_nodes, "edges": sorted([index[a], index[b]] for a, b in edges), "impact": impact},
          open(OUT, "w"), indent=1)
shutil.rmtree(work)
print(f"{len(out_nodes)} files, {len(edges)} imports, sprout {version}")
