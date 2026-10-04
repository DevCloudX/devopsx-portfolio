# DevOpsX

**Design. Compare. Validate. Generate.**

DevOpsX is a static, browser-based multi-cloud architecture studio for modeling AWS, Azure, and Google Cloud designs. Projects are stored locally; no cloud credentials, backend, database, OAuth, or AI API are required.

## Features

- React Flow canvas with drag-and-drop service placement, connections, multi-select, pan, zoom, minimap, delete, and undo/redo.
- Registry-backed catalog with search, provider filtering, recommendations, and virtualized results.
- Dynamic configuration forms, cross-cloud comparison, reviewed conversion drafts, architecture templates, and local AI-architect demo.
- Deterministic architecture findings derived from the graph and resource configuration.
- Illustrative cost estimates, Terraform/Kubernetes/Helm scaffolds, Markdown documentation, PNG/SVG/JSON export, and JSON import.
- Local project save/load, browser persistence, light/dark theme, and responsive mobile navigation.
- Hash-addressable module navigation for direct links and browser back/forward navigation.
- Local credential-pattern checks that hide detected values in findings.
- Service-specific AWS, Microsoft Azure, and Google Cloud icons are used for architecture resources; provider logos identify clouds in provider selectors and other provider-level views.

## Architecture

The frontend follows a data-to-engine-to-UI flow:

- `src/data/clouds/` contains structured AWS, Azure, and GCP service definitions and cross-cloud mappings.
- `src/engine/` contains graph creation, deterministic validation, cost assumptions, schema parsing, and generators.
- `src/state/` owns Zustand editing state and local workspace persistence.
- `src/App.tsx` renders the catalog, graph, properties, comparison, analysis, and generation views.
- `src/types/providers.ts` defines future integration boundaries; no provider is connected in this phase.

The interface computes service counts directly from the registry at runtime. The catalog is a curated, extensible selection of major services, not an exhaustive or authoritative inventory.

## Supported Clouds

AWS, Microsoft Azure, and Google Cloud. Mapping labels describe capability overlap and do not claim that products behave identically.

Provider logo SVGs are bundled locally from Iconify's Logos collection (CC0-1.0), so the interface does not fetch icons from a remote service. The provider names and marks remain trademarks of their respective owners.

## Development

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Portable Windows App

Build the no-install Windows x64 executable locally on Windows:

```bash
npm ci
npm run build:windows
```

The portable executable is written to `release/`. Push to `main` or manually run **Build DevOpsX Windows Portable App** from GitHub Actions to create a downloadable `DevOpsX-Windows-Portable` artifact. The workflow artifact is retained for 30 days. The app stores workspace data in the current Windows user's local Electron profile; it does not connect to cloud accounts or deploy resources. Windows may show a SmartScreen warning because the executable is not code-signed.

## GitHub Pages Deployment

Push to `main` to build and deploy the static site through `.github/workflows/deploy.yml`. The configured custom domain uses the root base path; when deploying without `public/CNAME`, Vite derives a project base path from `GITHUB_REPOSITORY`. Module navigation uses URL fragments, so direct module links and browser history work without server-side SPA rewrites. In repository settings, select **GitHub Actions** as the Pages build and deployment source.

## Project Structure

```text
src/
  data/clouds/{aws,azure,gcp,mappings}/
  engine/{architecture,generators,schema}.ts
  state/workspace.ts
  types/{index,providers}.ts
  App.tsx
.github/workflows/deploy.yml
```

## Future Backend Architecture

Typed interfaces are prepared for AI architecture generation, cloud validation, GitHub export, pricing, security scanning, project storage, and authentication. A future serverless API can implement these interfaces without moving secrets into the public static client. `.env.example` contains only a public API base URL placeholder; never put provider credentials or private API keys in `VITE_*` variables.

## Important Limitations

- Cost values are illustrative demo assumptions, not current provider pricing.
- Cost scenario multipliers are illustrative and do not model region-specific rates or live provider quotes.
- Terraform, Kubernetes, and Helm output are local scaffolds requiring provider-specific implementation and review; nothing is deployed.
- AI architecture generation is a local demo response, not an AI integration.
- Validation is a deterministic starter rule set, not a compliance certification or security scanner.
- Credential-pattern checks only catch common formats and are not a substitute for a dedicated secret scanner. Keep real credentials out of architecture configuration and exported files.
- Projects remain in this browser and are not synchronized.

## Contributing

Add services to provider registry data rather than hardcoding them into components. Extend deterministic engine rules and document relevant behavior when changing architecture semantics.