"use strict";

const fs = require("fs");
const path = require("path");

function getProjectRoot() {
  return path.resolve(process.env.NBS_PROJECT_ROOT || process.cwd());
}

function resolveFromProject(...segments) {
  return path.resolve(getProjectRoot(), ...segments);
}

function findFirstExistingPath(paths) {
  return paths.find(candidate => fs.existsSync(candidate)) || null;
}

function resolveProjectConfig(envKey, fileNames) {
  const explicitConfig = process.env[envKey];
  if (explicitConfig) {
    return resolveFromProject(explicitConfig);
  }

  return findFirstExistingPath(fileNames.map(fileName => resolveFromProject(fileName)));
}

function resolveDefaultConfig(fileName) {
  return path.resolve(__dirname, "..", "defaults", fileName);
}

function getSrcDir() {
  return resolveFromProject(process.env.NBS_SRC_DIR || "src");
}

function resolveProjectSource(explicitPath, candidateFiles, fallbackFileName) {
  if (explicitPath) {
    return resolveFromProject(explicitPath);
  }

  const projectFile = findFirstExistingPath(
    candidateFiles.map(fileName => path.join(getSrcDir(), fileName)),
  );

  return projectFile || resolveDefaultConfig(fallbackFileName);
}

function getEntryFile() {
  return resolveProjectSource(
    process.env.NBS_ENTRY_FILE,
    ["index.js", "index.jsx"],
    "runtime-entry.js",
  );
}

function getAppModulePath() {
  return resolveProjectSource(
    process.env.NBS_APP_MODULE,
    ["App.js", "App.jsx"],
    "missing-app.js",
  );
}

function getStaticAppModulePath() {
  return (
    resolveProjectConfig("NBS_STATIC_APP_MODULE", [
      "src/App.ssg.js",
      "src/App.static.js",
      "src/App.server.js",
    ]) || getAppModulePath()
  );
}

function getTemplatePath() {
  if (process.env.NBS_HTML_TEMPLATE) {
    return resolveFromProject(process.env.NBS_HTML_TEMPLATE);
  }

  const projectTemplate = path.join(getSrcDir(), "index.ejs");
  if (fs.existsSync(projectTemplate)) {
    return projectTemplate;
  }

  return path.resolve(__dirname, "..", "templates", "index.ejs");
}

function getAssetsDir() {
  return process.env.NBS_ASSETS_DIR
    ? resolveFromProject(process.env.NBS_ASSETS_DIR)
    : resolveFromProject("assets");
}

function getDistDir() {
  return process.env.NBS_OUTPUT_DIR
    ? resolveFromProject(process.env.NBS_OUTPUT_DIR)
    : resolveFromProject("dist");
}

function getDistAiDir() {
  return path.join(getDistDir(), "ai");
}

function getBabelConfigPath() {
  return (
    resolveProjectConfig("NBS_BABEL_CONFIG", [
      "babel.config.cjs",
      "babel.config.js",
      "babel.config.mjs",
    ]) || resolveDefaultConfig("babel.config.cjs")
  );
}

function getEslintConfigPath() {
  return (
    resolveProjectConfig("NBS_ESLINT_CONFIG", [
      "eslint.config.mjs",
      "eslint.config.js",
      "eslint.config.cjs",
    ]) || resolveDefaultConfig("eslint.config.mjs")
  );
}

function getPostcssConfigPath() {
  return (
    resolveProjectConfig("NBS_POSTCSS_CONFIG", [
      "postcss.config.cjs",
      "postcss.config.js",
      "postcss.config.mjs",
    ]) || resolveDefaultConfig("postcss.config.cjs")
  );
}

function getStyleEntryPath() {
  return resolveProjectSource(
    process.env.NBS_STYLE_ENTRY,
    ["index.css"],
    "index.css",
  );
}

function getTailwindConfigPath() {
  return resolveProjectConfig("NBS_TAILWIND_CONFIG", [
    "tailwind.config.cjs",
    "tailwind.config.js",
    "tailwind.config.mjs",
  ]);
}

module.exports = {
  getAppModulePath,
  getAssetsDir,
  getBabelConfigPath,
  getDistAiDir,
  getDistDir,
  getEntryFile,
  getEslintConfigPath,
  getPostcssConfigPath,
  getProjectRoot,
  getSrcDir,
  getStaticAppModulePath,
  getStyleEntryPath,
  getTailwindConfigPath,
  getTemplatePath,
  resolveFromProject,
};
