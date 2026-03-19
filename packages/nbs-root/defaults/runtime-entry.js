"use strict";

const React = require("react");
const { createRoot, hydrateRoot } = require("react-dom/client");
const { resolveClientElement } = require("../scripts/app-module");

const appModule = require("__NBS_APP_MODULE__");

require("__NBS_STYLE_ENTRY__");

const container = document.getElementById("root");

if (!container) {
  throw new Error('Unable to find the root element with id "root".');
}

const appElement = React.createElement(
  React.StrictMode,
  null,
  resolveClientElement(appModule),
);

if (container.hasChildNodes()) {
  hydrateRoot(container, appElement);
} else {
  createRoot(container).render(appElement);
}
