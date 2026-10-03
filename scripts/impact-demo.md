# The landing page's impact explorer data

`src/data/impact-demo.json` is generated from real Sprout output on the
backend of fastapi/full-stack-fastapi-template (the commit is in the file):

1. Copy the repository's `backend/` folder somewhere and `git init` it, so
   paths are relative to the backend.
2. For every Python file, `sprout deps FILE --json` gives the links; files
   with none are left out.
3. Files are laid out in columns by dependency depth (what they build on to
   the left, tests in the last column) and ordered to reduce crossings.
4. For every file, the panel text is `sprout impact FILE` and the counts come
   from `sprout impact FILE --json`.

Regenerate it when `sprout impact`'s output changes.
