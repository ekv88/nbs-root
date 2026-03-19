function NotFoundPage() {
  return (
    <section className="space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-300/80">
        not-found
      </p>
      <h1 className="text-2xl font-semibold text-white">
        This route is client-only and not emitted by SSG.
      </h1>
      <p className="text-sm leading-7 text-slate-300">
        `getStaticRoutes()` only includes concrete routes that should be
        written during static export.
      </p>
    </section>
  );
}

export { NotFoundPage };
