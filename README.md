# nbs-root

[![npm version](https://img.shields.io/npm/v/%40ekv88%2Fnbs-root?style=for-the-badge)](https://www.npmjs.com/package/@ekv88/nbs-root)
[![npm downloads](https://img.shields.io/npm/dm/%40ekv88%2Fnbs-root?style=for-the-badge)](https://www.npmjs.com/package/@ekv88/nbs-root)
[![CI](https://img.shields.io/github/actions/workflow/status/ekv88/nbs-root/ci.yml?branch=master&style=for-the-badge&label=CI)](https://github.com/ekv88/nbs-root/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Webpack 5](https://img.shields.io/badge/Webpack-5-8DD6F9?style=for-the-badge&logo=webpack&logoColor=black)](https://webpack.js.org/)
[![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

Minimal, project-agnostic tooling package built around Tailwind and Webpack. Drop it into a React project and get profile-based dev/build scripts, hydrated SSG, and AI-ready page context without rebuilding your tooling stack from scratch.

![preview](.github/intro.gif)

## ✨ Why Developers Pick It
- 🚀 One package gives you dev server, production builds, SSG, and AI output
- 🧩 Package-owned defaults keep projects clean and override-friendly
- ⚡ React hydration, code splitting, and standard SPA patterns work out of the box
- 🧠 AI-readable Markdown output helps with SEO, AEO, content workflows, and agent ingestion
- 🛠️ Route-aware static export works without turning the whole project into a framework migration

## 📊 Feature Snapshot
| Experience | What You Get | Command |
| --- | --- | --- |
| `SPA` | Dev server and production client bundle | `nbs-root dev:development` / `nbs-root build:production` |
| `SSG` | Static HTML output with client hydration | `nbs-root build-ssg:production` |
| `AI Optimized SEO / AEO` | AI-readable Markdown with page text, headings, metadata, and rendered markup | `nbs-root build-ai:production` |

## 🔥 Built For Real Projects
| Capability | Included |
| --- | --- |
| Hydration with `hydrateRoot` fallback | ✅ |
| Standard SPA flow | ✅ |
| Route-aware SSG | ✅ |
| AI-ready site context generation | ✅ |
| Webpack code splitting | ✅ |
| Tailwind-ready CSS pipeline | ✅ |
| Babel + ESLint + PostCSS defaults | ✅ |
| Project-level overrides when needed | ✅ |

## 📦 Install
For an existing React project:

```bash
npm i @ekv88/nbs-root
```

## 🚀 Quick Start
Minimal project shape:

```text
my-site/
  .env-cmdrc
  src/
    App.js
    index.css
  assets/
```

Example scripts:

```json
{
  "scripts": {
    "start": "nbs-root dev:development",
    "build:prod": "nbs-root build:production",
    "build:staging": "nbs-root build:staging",
    "build-ssg:prod": "nbs-root build-ssg:production",
    "build-ai:prod": "nbs-root build-ai:production",
    "lint": "nbs-root lint"
  }
}
```

By default, the only required project-level config is `.env-cmdrc`. The package provides defaults for Babel, ESLint, PostCSS, a Tailwind-ready CSS pipeline, the HTML template, and the runtime entry. If a project adds its own config or bootstrap files, those override the defaults.

## 🧭 Output Modes
### SPA build
- Produces the client app in `dist/`
- Emits JS to `dist/js/` and CSS to `dist/css/`
- Keeps `index.html`, `asset-manifest.json`, and copied assets at the `dist/` root

### SSG build
- Pre-renders static HTML
- Reuses the client bundle for hydration
- Supports multi-route output through `src/App.ssg.js`

### AI build
- Writes AI-readable Markdown into `dist/ai/`
- Includes visible text, headings, metadata, and markup snapshots
- Useful for AI SEO / AEO workflows and downstream tooling

## 🛠️ Override Only What You Need
- `src/index.js` or `src/index.jsx`
- `src/index.ejs`
- `src/App.ssg.js` or `src/App.static.js` or `src/App.server.js`
- `babel.config.*`
- `eslint.config.*`
- `postcss.config.*`
- `tailwind.config.*`

Env-based path overrides are also available, including `NBS_PROJECT_ROOT`, `NBS_APP_MODULE`, `NBS_STATIC_APP_MODULE`, `NBS_HTML_TEMPLATE`, and `NBS_OUTPUT_DIR`.

## 🌐 Route-Aware SSG
If a project wants multi-route static export, it can provide `src/App.ssg.js` and export:

```js
export function createStaticApp(route) {
  return <AppForRoute route={route} />;
}

export function getStaticRoutes() {
  return ["/", "/about", "/guides/ssg"];
}
```

If no static module is present, `nbs-root` falls back to the normal app module and renders a single root page.

## 🧪 Repo Development
This repo contains the package plus a local test project used to verify it before publishing.

- `npm run dev:test`
- `npm run build:test:prod`
- `npm run build:test:staging`
- `npm run build-ssg:test:prod`
- `npm run build-ai:test:prod`
- `npm run lint:test`
- `npm run pack:root`

## 🔗 Links
- npm: https://www.npmjs.com/package/@ekv88/nbs-root
- GitHub: https://github.com/ekv88/nbs-root
- Package-focused docs: [`packages/nbs-root/README.md`](packages/nbs-root/README.md)
