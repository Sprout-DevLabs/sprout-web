# sprout-web

The website and documentation for [Sprout](https://github.com/Sprout-DevLabs/sprout), served at
https://sprout-devlabs.github.io/sprout-web/.

- **Landing page:** [Astro](https://astro.build) and TypeScript, animated with [Motion](https://motion.dev).
  `prefers-reduced-motion` turns the animations off.
- **Docs:** [Starlight](https://starlight.astro.build), with search. Pages live in `src/content/docs/docs/`.
- **`public/install.sh`:** the installer at `/sprout-web/install.sh`. Keep that URL stable, because releases link to it.

```sh
npm install
npm run dev        # http://localhost:4321/sprout-web/
npm run build      # type-check, then build to dist/
```

## Sample output

The landing page shows real `sprout` output on [pallets/click](https://github.com/pallets/click), kept as plain text
in `src/data/`: `tour.txt`, `impact.txt` (`sprout impact src/click/core.py`) and `context.txt`
(`sprout context src/click/decorators.py --budget 300`). Regenerate them with the CLI rather than editing by hand.

Pushes to `main` deploy through `.github/workflows/pages.yml`, and pull requests are built and type-checked.
