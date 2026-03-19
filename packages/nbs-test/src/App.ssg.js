import { StaticRouter } from "react-router";
import { Root } from "./Root";

const staticRoutes = ["/", "/about", "/guides/ssg"];

function App() {
  return createStaticApp("/");
}

function createStaticApp(route = "/") {
  return (
    <StaticRouter location={route}>
      <Root />
    </StaticRouter>
  );
}

function getStaticRoutes() {
  return staticRoutes;
}

export { App, createStaticApp, getStaticRoutes };
