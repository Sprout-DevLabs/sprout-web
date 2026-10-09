---
title: Context for one file (context)
description: What to know before editing a file, fitted to a token budget.
---

```sh
sprout context FILE [--budget N] [--json]
```

`sprout context` is what to know before changing one file, in about `--budget` tokens (default 1500):

1. **Depends on**: each dependency, and only the declarations this file uses from it. For Go that's exact; elsewhere, declarations whose name appears in the file.
2. **Used by**: the files that use it, and why.
3. **Tests that reach it**: nearest first, with a `go test` command for Go.
4. **Declares**: last, since whoever edits the file reads that anyway.

Each part gets a share of the budget and passes on what it doesn't use. A part that doesn't fit says how many items it has.

```
$ sprout context app/crud.py --budget 500
# app/crud.py
2 dependencies · 3 direct users · 10 affected through them · 7 tests reach it

## depends on (and what it uses from each)
app/core/security.py — imports app.core.security
  def verify_password(…)
  def get_password_hash(password: str) -> str
app/models.py — imports app.models
  class UserCreate(UserBase)
  class UserUpdate(SQLModel)
  class User(UserBase, table=True)
  class ItemCreate(ItemBase)
  +1 more

## used by
app/api/routes/login.py — imports app.crud
app/api/routes/users.py — imports app.crud
app/core/db.py — imports app.crud

## tests that reach it
tests/api/routes/test_login.py
tests/api/routes/test_users.py
tests/crud/test_user.py
tests/utils/item.py
tests/utils/user.py
tests/api/routes/test_items.py
tests/conftest.py

## declares
def create_user(*, session: Session, user_create: UserCreate) -> User
def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any
def get_user_by_email(*, session: Session, email: str) -> User | None
def authenticate(*, session: Session, email: str, password: str) -> User | None
def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item
```

It's [`--ai`](/sprout-web/docs/guides/ai/) for one file: hand it to an agent before it edits, or read it yourself before touching code you don't know. Agents get it as the `context` [MCP tool](/sprout-web/docs/guides/mcp/).

## JSON

`--json` prints the same parts as one object, for scripts and agents:

```json
{
  "schemaVersion": 1,
  "command": "context",
  "file": "b/b.go",
  "dependencies": [{ "path": "a/a.go", "reason": "uses a.Hello", "signatures": ["func Hello() string"] }],
  "users": [{ "path": "c/c.go", "reason": "uses b.B" }],
  "tests": ["b/b_test.go"],
  "declarations": ["func B() string"]
}
```
