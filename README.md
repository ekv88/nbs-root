# NBS-root

Minimal, project-agnostic tooling package built around Tailwind and Webpack. The goal is to keep a small, reusable setup that you can drop into different projects to get consistent dev/build scripts and a baseline frontend stack without locking you into a specific product.

> [!WARNING]
> Work in progress. Do not use in production.

## What this includes
- Tailwind CSS + PostCSS pipeline (see `tailwind.config.cjs`, `postcss.config.cjs`).
- Webpack dev server and production builds with environment profiles.
- React + JSX via Babel (you can replace the app code but keep the build system).
- ESLint + Prettier defaults for consistent linting and formatting.
- Commit linting via `simple-git-hooks` and Conventional Commits.
- EJS HTML entry template at `src/index.ejs`.
- Common frontend deps included (React, Three.js, GSAP, Motion).

## Quick start
```bash
npm install
npm run dev
```

## Available scripts
- `npm run start` -> alias for `npm run dev`.
- `npm run dev` -> dev server using the development profile.
- `npm run build` -> alias for `npm run build:prod`.
- `npm run build:prod` -> production build with `ENV_PROFILE=production`.
- `npm run build:staging` -> staging build with `ENV_PROFILE=staging`.
- `npm run lint` -> lint JS/JSX in `src/`.
- `npm run postinstall` -> installs git hooks for commit linting.

## Environment profiles
Builds use `ENV_PROFILE` to switch config. The dev server uses `development`, and production builds use `production` or `staging`. Check `scripts/webpack.config.js` for profile-specific behavior.

## Project structure
- `src/` -> application code and the EJS entry template.
- `scripts/` -> Webpack configuration and build setup.
- `tailwind.config.cjs` -> Tailwind config.
- `postcss.config.cjs` -> PostCSS config.
- `babel.config.cjs` -> Babel config.
- `eslint.config.mjs` -> ESLint config.
