# sprout-web

The website and documentation for [Sprout](https://github.com/Sprout-DevLabs/sprout), served at
https://sprout-devlabs.github.io/sprout-web/.

- **Landing page:** [Astro](https://astro.build) and TypeScript, animated with [Motion](https://motion.dev).
  Animations only touch `transform` and `opacity`, and `prefers-reduced-motion` turns them off.
- **Docs:** [Starlight](https://starlight.astro.build), with search. Pages live in `src/content/docs/docs/`.
- **`public/install.sh`:** the installer at `/sprout-web/install.sh`. Keep that URL stable, because releases link to it.

```sh
npm install
npm run dev        # http://localhost:4321/sprout-web/
npm run build      # type-check, then build to dist/
```

## Demo data

`src/data/demo.json` is real `sprout` output (`--json`, `--ai` and `--entry`) for a sample project.
`scripts/check-parity.ts` checks that the landing page renders those trees exactly as the CLI prints them:

```sh
node scripts/check-parity.ts <dir containing m0.txt … m4.txt captured from the CLI>
```

Pushes to `main` deploy through `.github/workflows/pages.yml`, and pull requests are built and type-checked.
