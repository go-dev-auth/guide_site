# go-dev-auth guide

Documentation site for [go-dev-auth](https://github.com/go-dev-auth/go-dev-auth),
built with [Astro Starlight](https://starlight.astro.build).

## Develop

```bash
npm install
npm run dev      # http://localhost:4321/guide_site/
```

Pages live in `src/content/docs/` as Markdown. The sidebar is defined
in `astro.config.mjs`. Colors in `src/styles/theme.css`.

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via
`.github/workflows/deploy.yml`. One-time setup: repo **Settings →
Pages → Source → GitHub Actions**.

Site URL: https://go-dev-auth.github.io/guide_site/

To use a custom domain later, set it in Settings → Pages, then update
`site` and remove `base` in `astro.config.mjs`.
