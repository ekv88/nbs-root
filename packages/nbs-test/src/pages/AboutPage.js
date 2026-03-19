function AboutPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
          about
        </p>
        <h1 className="text-2xl font-semibold text-white">
          Page component moved under `src/pages`.
        </h1>
      </div>

      <div className="space-y-3 text-sm leading-7 text-slate-300">
        <p>`src/pages/AboutPage.js` is mounted at `/about` through `src/Root.js`.</p>
        <p>Expected static HTML output: `dist/about/index.html`.</p>
        <p>Expected AI snapshot: `dist/ai/pages/about/index.md`.</p>
      </div>
    </section>
  );
}

export { AboutPage };
