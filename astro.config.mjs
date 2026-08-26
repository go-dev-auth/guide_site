// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      // Every external link opens in a new tab.
      [
        rehypeExternalLinks,
        { target: '_blank', rel: ['noopener', 'noreferrer'] },
      ],
    ],
  },
  // Deployed on Vercel at the domain root. Update `site` if you attach
  // a custom domain (it is used for the sitemap and canonical URLs).
  site: 'https://guide-site.vercel.app',
  integrations: [
    starlight({
      title: 'go-dev-auth',
      description:
        'Authentication for Go — better-auth’s feature set, zero-dependency core.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/go-dev-auth/go-dev-auth',
        },
      ],
      customCss: ['./src/styles/theme.css'],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Getting started', slug: 'getting-started' },
            { label: 'Deploying behind a proxy', slug: 'guides/proxy' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Storage & migrations', slug: 'guides/storage' },
            { label: 'Social sign-on', slug: 'guides/social' },
            { label: 'Plugins', slug: 'guides/plugins' },
            { label: 'Sessions in your handlers', slug: 'guides/sessions' },
            { label: 'Rotating the secret', slug: 'guides/secret-rotation' },
            { label: 'Audit events', slug: 'guides/audit-events' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API endpoints', slug: 'reference/endpoints' },
            { label: 'Configuration', slug: 'reference/configuration' },
            { label: 'Security model', slug: 'reference/security' },
            { label: 'Performance & cost', slug: 'reference/performance' },
          ],
        },
        {
          label: 'Try it',
          items: [{ label: 'Sandbox', slug: 'sandbox' }],
        },
      ],
    }),
  ],
});
