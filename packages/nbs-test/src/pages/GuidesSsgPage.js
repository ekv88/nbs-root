const commands = [
  "npm run build:prod",
  "npm run build-ssg:prod",
  "npm run build-ai:prod",
];

function GuidesSsgPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
          guides/ssg
        </p>
        <h1 className="text-2xl font-semibold text-white">
          Nested paths should map to nested output folders.
        </h1>
      </div>

      <p className="text-sm leading-7 text-slate-300">
        This page exists to verify that a nested route like `/guides/ssg`
        produces `dist/guides/ssg/index.html` and
        `dist/ai/pages/guides/ssg/index.md`.
      </p>

      <div className="space-y-2 text-sm leading-7 text-slate-400">
        {commands.map(command => <p key={command}>[ run ] `{command}`</p>)}
      </div>
    </section>
  );
}

export { GuidesSsgPage };
