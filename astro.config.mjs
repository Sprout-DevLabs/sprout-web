// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const fonts =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap';

export default defineConfig({
  site: 'https://sprout-devlabs.github.io',
  base: '/sprout-web',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Sprout',
      description: 'The map of your codebase, for you and your AI agent.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/icon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Sprout-DevLabs/sprout' }],
      editLink: { baseUrl: 'https://github.com/Sprout-DevLabs/sprout-web/edit/main/' },
      customCss: ['./src/styles/starlight.css'],
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: fonts } },
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', slug: 'docs' },
            { label: 'Install', slug: 'docs/install' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'The tree', slug: 'docs/guides/tree' },
            { label: 'AI context (--ai)', slug: 'docs/guides/ai' },
            { label: 'Reading order (--entry)', slug: 'docs/guides/entry' },
            { label: 'Git, diffs and hotspots', slug: 'docs/guides/git' },
            { label: 'Remote repositories', slug: 'docs/guides/remote' },
            { label: 'MCP for coding agents', slug: 'docs/guides/mcp' },
            { label: 'Config files', slug: 'docs/guides/config' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'All flags', slug: 'docs/reference/flags' },
            { label: 'JSON output', slug: 'docs/reference/json' },
            { label: 'Completions, man page, exit codes', slug: 'docs/reference/shell' },
            { label: 'Performance', slug: 'docs/reference/performance' },
            { label: 'Benchmark log', link: '/benchmarks/' },
          ],
        },
        { label: 'FAQ', slug: 'docs/faq' },
      ],
    }),
  ],
});
