function HomePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
          home
        </p>
        <h1 className="text-2xl font-semibold text-white">
          Root page rendered by the package bootstrap.
        </h1>
      </div>

      <div className="space-y-4 text-sm leading-7 text-slate-300">
        <p>
          The client runtime comes from `nbs-root`. It mounts in strict mode,
          hydrates when prerendered markup exists, and falls back to a normal
          client render otherwise.
        </p>
        <p>
          This page is the simplest route check: it should exist in
          `dist/index.html` and in `dist/ai/pages/index.md`.
        </p>
      </div>

      <div className="text-sm leading-7 text-slate-400">
        <p>[ check ] `npm run build-ssg:prod`</p>
        <p>[ check ] `npm run build-ai:prod`</p>
        <p>[ check ] browser navigation between links</p>
      </div>
    </section>
  );
}

export { HomePage };
