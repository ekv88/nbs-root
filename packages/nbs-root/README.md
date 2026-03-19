# nbs-root

Reusable frontend tooling shell for consumer projects. It provides a CLI for development builds, production builds, static site generation, and AI-readable Markdown context generation.

By default the package serves its own Babel, ESLint, PostCSS, Tailwind-ready, HTML template, runtime entry, and hydration setup. Consumer projects only need their source files plus `.env-cmdrc`. If a consumer project adds its own config files or bootstrap entry, those override the package defaults.

## CLI
- `nbs-root dev:development`
- `nbs-root build:production`
- `nbs-root build:staging`
- `nbs-root build-ssg:production`
- `nbs-root build-ai:staging`
- `nbs-root lint`

## Consumer defaults
- `src/App.js`
- `.env-cmdrc`
- `assets/` optional
- `src/index.css` optional

## Optional consumer overrides
- `src/index.js` / `src/index.jsx`
- `src/index.ejs`
- `src/App.ssg.js` / `src/App.static.js` / `src/App.server.js`
- `babel.config.cjs` / `babel.config.js` / `babel.config.mjs`
- `eslint.config.mjs` / `eslint.config.js` / `eslint.config.cjs`
- `postcss.config.cjs` / `postcss.config.js` / `postcss.config.mjs`
- `tailwind.config.cjs`

## Optional overrides
- `NBS_PROJECT_ROOT`
- `NBS_SRC_DIR`
- `NBS_ENTRY_FILE`
- `NBS_APP_MODULE`
- `NBS_STATIC_APP_MODULE`
- `NBS_STYLE_ENTRY`
- `NBS_HTML_TEMPLATE`
- `NBS_ASSETS_DIR`
- `NBS_OUTPUT_DIR`
- `NBS_BABEL_CONFIG`
- `NBS_ESLINT_CONFIG`
- `NBS_POSTCSS_CONFIG`
- `NBS_TAILWIND_CONFIG`

If a `tailwind.config.*` file is present, `nbs-root` injects the corresponding Tailwind `@config` directive automatically so the config becomes active without requiring the consumer to edit their base CSS import.

If `src/index.ejs` is present, both the webpack HTML build and the SSG output use it. If it is missing, the package fallback template is used.

If `src/index.js` is missing, the package fallback runtime mounts the app in `React.StrictMode`, uses `hydrateRoot` when prerendered HTML exists, falls back to `createRoot` otherwise, and imports `src/index.css` when present. The default runtime also accepts either `export { App }` or `export default App`.

Code splitting works out of the box through webpack chunking and standard React lazy-loading patterns such as `React.lazy(() => import("./Feature"))`.

Production client assets are emitted under `dist/js/` and `dist/css/`, while `index.html`, `asset-manifest.json`, and copied static assets stay at the `dist/` root.

## Route-aware SSG
For multi-route static export, provide a dedicated static app module such as `src/App.ssg.js`. It can export:
- `createStaticApp(route)` -> returns the React tree for a specific route, typically wrapped in a static router.
- `getStaticRoutes()` -> returns the list of concrete routes to emit, for example `["/", "/about", "/guides/ssg"]`.

If no static app module is present, SSG falls back to the normal app module and only renders a single root page.

## Consumer example
```json
{
  "scripts": {
    "dev": "nbs-root dev:development",
    "build:prod": "nbs-root build:production",
    "build:staging": "nbs-root build:staging",
    "build-ssg:prod": "nbs-root build-ssg:production",
    "build-ai:prod": "nbs-root build-ai:production",
    "lint": "nbs-root lint"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "nbs-root": "0.1.0"
  }
}
```

## Monorepo testing
This repository includes `packages/nbs-test`, which acts as the local consumer project used to verify the package behavior before publishing. In the workspace it links `nbs-root` via `file:../nbs-root`, so the consumer app exercises the same package entrypoints that an external project would use.
