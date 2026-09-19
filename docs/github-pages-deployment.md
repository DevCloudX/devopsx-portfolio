# GitHub Pages deployment

DevOpsX is built as a static Vite application. The deployed site does not require Node.js, a server, a database, or an API at runtime.

## Repository setup

1. Push the repository to GitHub on the `main` branch.
2. In **Settings > Pages**, set the source to **GitHub Actions**.
3. Keep `public/CNAME` set to `devopsx.in`.
4. Point the apex domain DNS records to GitHub Pages and enable HTTPS after DNS propagation.

The workflow in `.github/workflows/deploy.yml` installs dependencies with `npm ci`, runs the linter, generates the sitemap/search index, builds `dist`, prerenders each public route as static HTML, and deploys the Pages artifact.

## Local validation

```bash
npm ci
npm run check
npm run dev
```

The static generators write `public/sitemap.xml`, `public/search-index.json`, and route-specific HTML in `dist` during every production build. Search is client-side and works without a backend; route-specific pages are available directly without a Pages SPA fallback.

## Optional integrations

- Set `VITE_GA_ID` in the GitHub Actions environment to enable the optional analytics loader.
- Set `CONTACT_FORM_ENDPOINT` in `src/config/contact.js` to a public form provider if a hosted form is required. The default is a mailto fallback.
- The newsletter UI is intentionally provider-neutral. Connect it to a static-compatible provider before collecting addresses.

Do not commit `.env`, credentials, API keys, private keys, or provider secrets.
