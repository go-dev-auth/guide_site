# go-dev-auth guide

Documentation site for [go-dev-auth](https://github.com/go-dev-auth/go-dev-auth),
built with [Astro Starlight](https://starlight.astro.build).

## Develop

```bash
npm install
npm run dev      # http://localhost:4321/
```

Pages live in `src/content/docs/` as Markdown. The sidebar is defined
in `astro.config.mjs`. Colors in `src/styles/theme.css`.

## Deploy

Deployed on Vercel: pushes to `main` build and deploy automatically
(Vercel auto-detects Astro; no configuration needed).

If you attach a custom domain, update `site` in `astro.config.mjs` so
the sitemap and canonical URLs match.
