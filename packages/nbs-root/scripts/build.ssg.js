"use strict";

const ejs = require("ejs");
const fs = require("fs");
const Module = require("module");
const path = require("path");
const React = require("react");
const { renderToString } = require("react-dom/server");
const webpack = require("webpack");
const { merge } = require("webpack-merge");

const {
  banner,
  error,
  filterPublicEnvVars,
  info,
  serializeWindowEnvValue,
  success,
  warn,
} = require("./utils");
const { normalizeRoute, resolveStaticElement, resolveStaticRoutes } = require("./app-module");
const webpackConfig = require("./webpack.config");
const { createProdConfig } = require("./webpack.prod");
const {
  getBabelConfigPath,
  getDistDir,
  getProjectRoot,
  getStaticAppModulePath,
  getSrcDir,
  getTemplatePath,
} = require("./project-paths");

const { createBaseConfig, resolveProfile } = webpackConfig;

function closeCompiler(compiler) {
  return new Promise((resolve, reject) => {
    compiler.close(closeError => {
      if (closeError) {
        reject(closeError);
        return;
      }

      resolve();
    });
  });
}

function runWebpackBuild(config) {
  return new Promise((resolve, reject) => {
    const compiler = webpack(config);

    compiler.run(async (runError, stats) => {
      try {
        if (runError) {
          throw runError;
        }

        if (!stats) {
          throw new Error("Webpack did not return build stats.");
        }

        if (stats.hasErrors()) {
          throw new Error("Webpack build failed.");
        }

        await closeCompiler(compiler);
        resolve(stats);
      } catch (buildError) {
        try {
          await closeCompiler(compiler);
        } catch (closeError) {
          reject(closeError);
          return;
        }

        reject(buildError);
      }
    });
  });
}

function resolveBabelDependencyName(entry) {
  if (typeof entry === "string") {
    return entry;
  }

  if (Array.isArray(entry) && typeof entry[0] === "string") {
    return entry[0];
  }

  return null;
}

function validateBabelDependencies() {
  const babelConfigPath = getBabelConfigPath();

  if (!fs.existsSync(babelConfigPath)) {
    return;
  }

  const babelConfig = require(babelConfigPath);
  const entries = [
    ...(Array.isArray(babelConfig.presets) ? babelConfig.presets : []),
    ...(Array.isArray(babelConfig.plugins) ? babelConfig.plugins : []),
  ];
  const missingEntries = entries
    .map(resolveBabelDependencyName)
    .filter(Boolean)
    .filter(entry => {
      try {
        require.resolve(entry, {
          paths: [path.dirname(babelConfigPath), getProjectRoot()],
        });
        return false;
      } catch {
        return true;
      }
    });

  if (missingEntries.length > 0) {
    throw new Error(
      `Missing Babel dependency: ${missingEntries.join(", ")}. Run npm install before building SSG.`,
    );
  }
}

function registerServerRenderingHooks() {
  const srcRoot = getSrcDir();
  const originalResolveFilename = Module._resolveFilename;
  const ignoreStyleImport = ignoredModule => {
    ignoredModule.exports = {};
  };

  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request === "@") {
      return originalResolveFilename.call(this, srcRoot, parent, isMain, options);
    }

    if (request.startsWith("@/")) {
      const aliasedRequest = path.join(srcRoot, request.slice(2));
      return originalResolveFilename.call(this, aliasedRequest, parent, isMain, options);
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  require.extensions[".css"] = ignoreStyleImport;
  require.extensions[".scss"] = ignoreStyleImport;
  require.extensions[".sass"] = ignoreStyleImport;
  require.extensions[".svg"] = (assetModule, filename) => {
    assetModule.exports = filename;
  };

  require("@babel/register")({
    babelrc: false,
    configFile: getBabelConfigPath(),
    extensions: [".js", ".jsx"],
    ignore: [/node_modules/u],
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toPublicAssetPath(file, publicPath) {
  if (/^(?:[a-z]+:)?\/\//iu.test(file) || file.startsWith("/")) {
    return file;
  }

  const normalizedPublicPath = publicPath.endsWith("/") ? publicPath : `${publicPath}/`;
  const normalizedFile = file.replaceAll("\\", "/").replace(/^\/+/u, "");

  return `${normalizedPublicPath}${normalizedFile}`;
}

function collectEntrypointAssets(stats) {
  const mainEntrypoint = stats.compilation.entrypoints.get("main");

  if (!mainEntrypoint) {
    throw new Error('Unable to find webpack entrypoint "main" for SSG output.');
  }

  const files = mainEntrypoint
    .getFiles()
    .filter(file => !file.endsWith(".map"));

  return {
    cssFiles: files.filter(file => file.endsWith(".css")),
    jsFiles: files.filter(file => file.endsWith(".js")),
  };
}

function createAssetTags(files, publicPath) {
  const cssTags = files.cssFiles.map(
    file => `    <link rel="stylesheet" href="${escapeHtml(toPublicAssetPath(file, publicPath))}" />`
  );
  const scriptTags = files.jsFiles.map(
    file => `    <script defer src="${escapeHtml(toPublicAssetPath(file, publicPath))}"></script>`
  );

  return {
    css: cssTags.join("\n"),
    js: scriptTags.join("\n"),
  };
}

function injectRootMarkup(html, appHtml, rootPlaceholder) {
  if (html.includes(rootPlaceholder)) {
    return html.replaceAll(rootPlaceholder, appHtml);
  }

  if (/<div\s+id=["']root["']\s*><\/div>/iu.test(html)) {
    return html.replace(
      /<div\s+id=["']root["']\s*><\/div>/iu,
      `<div id="root">${appHtml}</div>`,
    );
  }

  throw new Error('SSG template must include a `#root` container or use the `rootMarkup` template variable.');
}

function createDocument({
  appHtml,
  assetTags,
  envVars,
  title,
}) {
  const tagPlaceholders = {
    body: "__NBS_BODY_TAGS__",
    head: "__NBS_HEAD_TAGS__",
    root: "__NBS_ROOT_MARKUP__",
  };
  const headTags = assetTags.css;
  const bodyTags = assetTags.js;
  const templateSource = fs.readFileSync(getTemplatePath(), "utf8");
  const renderedTemplate = ejs.render(templateSource, {
    env: envVars,
    htmlWebpackPlugin: {
      options: {
        title,
      },
      tags: {
        bodyTags: tagPlaceholders.body,
        headTags: tagPlaceholders.head,
      },
    },
    rootMarkup: tagPlaceholders.root,
    serializeWindowEnvValue,
  });

  return injectRootMarkup(
    renderedTemplate
      .replaceAll(tagPlaceholders.head, headTags)
      .replaceAll(tagPlaceholders.body, bodyTags),
    appHtml,
    tagPlaceholders.root,
  );
}

function getOutputPathForRoute(route) {
  const normalizedRoute = normalizeRoute(route);

  if (normalizedRoute === "/") {
    return path.resolve(getDistDir(), "index.html");
  }

  const routeSegments = normalizedRoute
    .replace(/^\/+/u, "")
    .split("/")
    .filter(Boolean);

  return path.resolve(getDistDir(), ...routeSegments, "index.html");
}

async function buildStaticSite() {
  console.clear();
  banner();
  console.log("");

  const profileConfig = resolveProfile();
  const {
    profile,
    envVars,
    mode: profileMode,
    basePath,
    publicPath,
    title,
  } = profileConfig;
  const mode = "production";

  success(`Building static export with profile "${profile}" (${mode} bundle).`);
  if (profileMode !== mode) {
    warn(
      `Env profile "${profile}" declares NODE_ENV=${profileMode}. SSG will still emit a production client bundle.`,
    );
  }
  info(`Output: ${getDistDir()}`);
  console.log("");

  process.chdir(getProjectRoot());
  process.env.NODE_ENV = mode;
  validateBabelDependencies();

  const buildConfig = merge(
    createBaseConfig({
      mode,
      envVars,
      publicPath,
      basePath,
      title,
    }),
    createProdConfig(),
  );

  const stats = await runWebpackBuild(buildConfig);

  registerServerRenderingHooks();

  const appModule = require(getStaticAppModulePath());
  const routes = resolveStaticRoutes(appModule);
  const assetTags = createAssetTags(collectEntrypointAssets(stats), publicPath);
  const publicEnvVars = filterPublicEnvVars(envVars);

  routes.forEach(route => {
    const appHtml = renderToString(resolveStaticElement(appModule, route));
    const html = createDocument({
      appHtml,
      assetTags,
      envVars: publicEnvVars,
      title,
    });
    const outputPath = getOutputPathForRoute(route);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, "utf8");
  });

  success(`SSG documents written for ${routes.length} route(s).`);
}

buildStaticSite().catch(buildError => {
  error(buildError.stack || buildError.message || String(buildError));
  process.exitCode = 1;
});
