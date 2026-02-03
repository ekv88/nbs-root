function App() {
  const ascii = `
    _  _____  ____    ___  ____  ____  ______
   / |/ / _ )/ __/___/ _ \\/ __ \\/ __ \\/_  __/
  /    / _  |\\ \\/___/ , _/ /_/ / /_/ / / /   
 /_/|_/____/___/   /_/|_|\\____/\\____/ /_/    
`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
        <pre className="overflow-x-auto text-[19px] leading-tight text-emerald-200">
          {ascii}
        </pre>

        <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-[0_0_80px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quick Start
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    <code className="rounded bg-slate-800 px-2 py-1">npm run dev</code>{" "}
                    to start the dev server.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    <code className="rounded bg-slate-800 px-2 py-1">
                      npm run build:prod
                    </code>{" "}
                    for a production bundle.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    <code className="rounded bg-slate-800 px-2 py-1">
                      npm run build:staging
                    </code>{" "}
                    for the staging profile.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    <code className="rounded bg-slate-800 px-2 py-1">npm run lint</code>{" "}
                    to check lint rules.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Customize
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>
                    Replace this layout in{" "}
                    <code className="rounded bg-slate-800 px-2 py-1">src/App.js</code>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>
                    Update lint rules in{" "}
                    <code className="rounded bg-slate-800 px-2 py-1">
                      eslint.config.mjs
                    </code>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>
                    Tweak Tailwind base styles in{" "}
                    <code className="rounded bg-slate-800 px-2 py-1">
                      src/index.css
                    </code>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>
                    Adjust scripts and build targets in{" "}
                    <code className="rounded bg-slate-800 px-2 py-1">package.json</code>.
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export { App };
