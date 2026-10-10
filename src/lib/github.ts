// The repository's star count, read when the site builds (the Site workflow
// rebuilds every 6 hours). Shown only from STAR_THRESHOLD up: a small number
// works against the button it sits on.
export const REPO = 'Sprout-DevLabs/sprout';
export const STAR_THRESHOLD = 100;

let cached: Promise<number | null> | undefined;

export function stars(): Promise<number | null> {
  cached ??= (async () => {
    try {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers });
      if (!res.ok) return null;
      const { stargazers_count } = (await res.json()) as { stargazers_count?: number };
      return typeof stargazers_count === 'number' ? stargazers_count : null;
    } catch {
      return null; // offline builds still work, just without a count
    }
  })();
  return cached;
}

export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);
}
