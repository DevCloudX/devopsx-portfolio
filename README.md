# DevOpsX

A static React + Vite website for DevOpsX, a DevOps, DevSecOps and cloud infrastructure consulting practice. It has no backend or database and can be deployed directly to GitHub Pages.

## Local setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The conversion landing page is available at `/devops-consulting`.

## Development and build

```bash
npm run lint
npm run build
npm run preview
```

The production output is written to `dist/`.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` installs dependencies, lints, builds and deploys `dist` using the current Pages artifact deployment. In repository settings, choose **Pages > Source: GitHub Actions**. Push to `main` to deploy.

For a project URL such as `https://USERNAME.github.io/REPOSITORY/`, set `VITE_BASE_PATH` to `/REPOSITORY/`. For a custom domain, leave it as `/`.

## Custom domain

In **Repository Settings > Pages**, choose **GitHub Actions**, then add the custom domain. Create a DNS `CNAME` record from your chosen subdomain to `USERNAME.github.io`, or use GitHub's documented apex records. Enable HTTPS after DNS has propagated. Do not hard-code the eventual domain in source.

## Contact form

Edit `src/config/contact.js` and set `CONTACT_FORM_ENDPOINT` to a public form provider endpoint that accepts POST submissions. The form uses an email fallback while the endpoint is empty; change `CONTACT_EMAIL` to the real public inbox. Never place private API keys in this repository.

## Google Analytics and conversions

Copy `.env.example` to `.env.local` and set `VITE_GA_ID` to the public measurement ID. Tracking only loads when the variable exists. Add provider-specific conversion events to CTA/form handlers as needed without exposing secrets.

## Social links and content

Replace placeholder social values in `src/config/site.js`. Services, representative case studies, blog posts and placeholder testimonials live in `src/data/content.js`. Add a project or blog object there; only replace the testimonial placeholder with a verified reference and permission to publish it.

## Static routing note

The app renders `/devops-consulting` as a client-side route. GitHub Pages serves the root app correctly; for direct refreshes on nested routes, configure the host's SPA fallback or use internal navigation.

## Security

No credentials, tokens, customer names, revenue claims or confidential client information are included. Keep `.env` and `.env.local` untracked and use only public configuration values in the frontend.
