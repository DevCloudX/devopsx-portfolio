# DevOpsX Engineering Platform

DevOpsX is a static React + Vite engineering knowledge platform for DevOps, DevSecOps, cloud infrastructure, Kubernetes, Terraform, CI/CD, observability, automation and AI-assisted engineering. A build-time prerenderer writes crawlable HTML for each public URL, while React adds search and responsive navigation in the browser.

## Local development

```bash
npm ci
npm run dev
```

## Validation and build

```bash
npm run lint
npm run build
npm run check
```

`npm run build` first generates `public/sitemap.xml` and `public/search-index.json`, then writes the production site to `dist/`.

## Routes

- `/` - engineering platform homepage
- `/blog` - searchable article archive
- `/blog/:slug` - article detail pages preserving the existing article URLs
- `/:topic` - category landing pages for DevOps, DevSecOps, Kubernetes, AWS, Azure, Terraform, GitHub Actions, Observability, Automation and AI
- `/resources` - resource center
- `/freelance` - consulting services and process
- `/about` - about DevOpsX
- `/search` - client-side article search

Every public route is emitted as its own `index.html`, so direct nested route loads do not rely on an SPA fallback.

## GitHub Pages

The site is static at runtime. It does not require Node.js, Express, PHP, a database, Supabase, or a server-side API. Deployments are handled by `.github/workflows/deploy.yml` using the GitHub Pages artifact actions. Set **Settings > Pages > Source** to **GitHub Actions**.

The custom domain is preserved in `public/CNAME` as `devopsx.in`. DNS and HTTPS setup notes are in `docs/github-pages-deployment.md`.

## Content

Existing generated and syndicated article data is preserved in `src/data/blogs.js` and `src/data/remoteBlogs.js`. `scripts/generate-static-index.mjs` creates the sitemap and search index, and `scripts/prerender-static-pages.mjs` writes static, metadata-rich page shells from the same content without changing published URLs.

## Optional integrations

- Set `VITE_GA_ID` to enable optional Google Analytics loading.
- Configure `CONTACT_FORM_ENDPOINT` in `src/config/contact.js` with a public form provider if a hosted form is needed. The default uses an email fallback.
- Connect the newsletter form to a static-compatible provider before collecting addresses; the default UI intentionally does not submit data anywhere.

Never commit `.env`, tokens, API keys, private keys, or provider credentials.
