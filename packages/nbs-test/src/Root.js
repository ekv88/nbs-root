import { Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { GuidesSsgPage } from "./pages/GuidesSsgPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";

function Root() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="guides/ssg" element={<GuidesSsgPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export { Root };
