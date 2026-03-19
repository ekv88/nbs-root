import { NavLink, Outlet } from "react-router";

const links = [
  { label: "home", to: "/" },
  { label: "about", to: "/about" },
  { label: "ssg", to: "/guides/ssg" },
];

function renderNavLabel({ isActive }, label) {
  if (!isActive) {
    return <span>[ {label} ]</span>;
  }

  return (
    <span>
      [ {label}
      <span className="text-emerald-400">*</span>
      {" ]"}
    </span>
  );
}

function AppShell() {
  const ascii = `
    _  _____  ____    ___  ____  ____  ______
   / |/ / _ )/ __/___/ _ \\/ __ \\/ __ \\/_  __/
  /    / _  |\\ \\/___/ , _/ /_/ / /_/ / / /   
 /_/|_/____/___/   /_/|_|\\____/\\____/ /_/    
`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-9">
        <header className="space-y-3">
          <pre className="logo-mark overflow-x-auto text-[19px] leading-tight text-transparent">
            {ascii}
          </pre>

          <nav className="flex flex-wrap items-center gap-2 text-[15px] leading-6 text-slate-400">
            {links.map((link, index) => (
              <div key={link.to} className="flex items-center gap-2">
                <NavLink
                  className="font-medium text-slate-200 transition-colors hover:text-white"
                  to={link.to}
                >
                  {navState => renderNavLabel(navState, link.label)}
                </NavLink>
                {index < links.length - 1 ? <span>/</span> : null}
              </div>
            ))}
          </nav>
        </header>

        <section className="border border-slate-800/90 bg-slate-950/30 px-5 py-5 shadow-[0_0_0_1px_rgba(15,23,42,0.2)]">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export { AppShell };
