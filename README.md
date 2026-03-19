# nbs-root

Minimal, project-agnostic tooling package built around Tailwind and Webpack. The goal is to keep a small, reusable setup that you can drop into different projects to get consistent dev/build scripts and a baseline frontend stack without locking you into a specific product.

![preview](.github/intro.gif)

## What it does
- Runs a dev server with env profiles from `.env-cmdrc`
- Builds production client bundles
- Supports hydration with a default `hydrateRoot` / `createRoot` runtime fallback
- Supports standard webpack code splitting and `React.lazy(...)`
- Generates multi-route static HTML with `build-ssg:*`
- Generates AI-readable Markdown site context with `build-ai:*`

## Consumer quick start
Install `nbs-root` into another project:

```bash
npm i @ekv88/nbs-root
```

Minimal consumer layout:

```text
my-site/
  .env-cmdrc
  src/
    App.js
    index.css
  assets/
```

Example consumer scripts:

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

By default, the only required project-level config is `.env-cmdrc`. The package provides defaults for Babel, ESLint, PostCSS, a Tailwind-ready CSS pipeline, the HTML template, and the runtime entry. If the consumer creates its own config or bootstrap files, those override the defaults.

## Output modes
`build:*`

- Produces the client app in `dist/`
- Emits JS to `dist/js/` and CSS to `dist/css/`
- Keeps `index.html`, `asset-manifest.json`, and copied static assets at the `dist/` root

`build-ssg:*`

- Pre-renders HTML for static routes
- Reuses the client bundle for hydration on the client
- Supports multi-route output through `src/App.ssg.js`

`build-ai:*`

- Emits AI-readable Markdown into `dist/ai/`
- Includes page summaries, headings, visible text, metadata, and rendered markup snapshots
- Useful for AI SEO / AEO workflows, content audits, and downstream agent ingestion

## Route-aware SSG
If a consumer wants multi-route static export, it can provide `src/App.ssg.js` and export:

```js
export function createStaticApp(route) {
  return <AppForRoute route={route} />;
}

export function getStaticRoutes() {
  return ["/", "/about", "/guides/ssg"];
}
```

If no static module is present, `nbs-root` falls back to the normal app module and renders a single root page.

## Optional consumer overrides
- `src/index.js` or `src/index.jsx`
- `src/index.ejs`
- `src/App.ssg.js` or `src/App.static.js` or `src/App.server.js`
- `babel.config.*`
- `eslint.config.*`
- `postcss.config.*`
- `tailwind.config.*`

There are also env-based overrides for paths such as `NBS_PROJECT_ROOT`, `NBS_APP_MODULE`, `NBS_STATIC_APP_MODULE`, `NBS_HTML_TEMPLATE`, and `NBS_OUTPUT_DIR`.

## Local workspace commands
- `npm run dev:test`
- `npm run build:test:prod`
- `npm run build:test:staging`
- `npm run build-ssg:test:prod`
- `npm run build-ai:test:prod`
- `npm run lint:test`
- `npm run pack:root`
