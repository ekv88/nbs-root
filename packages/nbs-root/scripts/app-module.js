"use strict";

const React = require("react");

function normalizeRoute(route) {
  const normalized = String(route || "/")
    .trim()
    .split(/[?#]/u)[0]
    .replace(/\/{2,}/gu, "/");

  if (!normalized || normalized === "/") {
    return "/";
  }

  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;

  return withLeadingSlash.replace(/\/+$/u, "") || "/";
}

function resolveAppComponent(moduleExports) {
  if (typeof moduleExports === "function") {
    return moduleExports;
  }

  if (moduleExports && typeof moduleExports.App === "function") {
    return moduleExports.App;
  }

  if (moduleExports && typeof moduleExports.default === "function") {
    return moduleExports.default;
  }

  throw new Error(
    'Expected the app module to export a React component as `App` or as the default export.',
  );
}

function toRenderableElement(value) {
  if (React.isValidElement(value)) {
    return value;
  }

  if (typeof value === "function") {
    return React.createElement(value);
  }

  return value;
}

function resolveClientElement(moduleExports) {
  if (moduleExports && typeof moduleExports.createClientApp === "function") {
    return toRenderableElement(moduleExports.createClientApp());
  }

  return React.createElement(resolveAppComponent(moduleExports));
}

function resolveStaticElement(moduleExports, route = "/") {
  if (moduleExports && typeof moduleExports.createStaticApp === "function") {
    return toRenderableElement(moduleExports.createStaticApp(route));
  }

  return React.createElement(resolveAppComponent(moduleExports));
}

function resolveStaticRoutes(moduleExports) {
  const routes =
    moduleExports && typeof moduleExports.getStaticRoutes === "function"
      ? moduleExports.getStaticRoutes()
      : ["/"];

  if (!Array.isArray(routes) || routes.length === 0) {
    return ["/"];
  }

  return [...new Set(routes.map(normalizeRoute).filter(Boolean))];
}

module.exports = {
  normalizeRoute,
  resolveAppComponent,
  resolveClientElement,
  resolveStaticElement,
  resolveStaticRoutes,
};
