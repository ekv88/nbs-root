"use strict";

const fs = require("fs");
const Module = require("module");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const {
  banner,
  error,
  filterPublicEnvVars,
  info,
  success,
} = require("./utils");
const { normalizeRoute, resolveStaticElement, resolveStaticRoutes } = require("./app-module");
const webpackConfig = require("./webpack.config");
const {
  getBabelConfigPath,
  getDistAiDir,
  getProjectRoot,
  getStaticAppModulePath,
  getSrcDir,
} = require("./project-paths");

const { resolveProfile } = webpackConfig;

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
      `Missing Babel dependency: ${missingEntries.join(", ")}. Run npm install before building AI context.`,
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

function dedupe(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function decodeHtmlEntities(value) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return String(value).replace(/&(amp|lt|gt|quot|#39|nbsp);/gu, match => entities[match] || match);
}

function stripTags(value) {
  return String(value).replace(/<[^>]+>/gu, " ");
}

function normalizeWhitespace(value) {
  return String(value)
    .replace(/\r/gu, "")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function normalizeInlineText(value) {
  return normalizeWhitespace(value).replace(/\n+/gu, " ");
}

function toPlainText(value) {
  return normalizeInlineText(decodeHtmlEntities(stripTags(value)));
}

function toBlockText(value) {
  return normalizeWhitespace(decodeHtmlEntities(stripTags(value)));
}

function escapeMarkdown(value) {
  return String(value).replace(/([\\`*_{}[\]()#+\-.!|>])/gu, "\\$1");
}

function createCodeFence(value, language = "") {
  return `\`\`\`${language}\n${String(value).trim()}\n\`\`\``;
}

function extractMatches(markup, pattern, mapper) {
  const matches = [];

  for (const match of markup.matchAll(pattern)) {
    const mapped = mapper(match);
    if (mapped) {
      matches.push(mapped);
    }
  }

  return matches;
}

function createVisibleTextSnapshot(markup) {
  const withBlockBreaks = markup
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/(h[1-6]|p|li|ul|ol|section|article|div|main|pre)>/giu, "\n");

  return normalizeWhitespace(decodeHtmlEntities(stripTags(withBlockBreaks)));
}

function analyzeMarkup(markup) {
  const headings = extractMatches(
    markup,
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/giu,
    match => {
      const text = toPlainText(match[2]);
      if (!text) {
        return null;
      }

      return {
        level: Number(match[1]),
        text,
      };
    },
  );
  const listItems = extractMatches(
    markup,
    /<li\b[^>]*>([\s\S]*?)<\/li>/giu,
    match => toPlainText(match[1]),
  );
  const codeSnippets = extractMatches(
    markup,
    /<code\b[^>]*>([\s\S]*?)<\/code>/giu,
    match => toPlainText(match[1]),
  );
  const preBlocks = extractMatches(
    markup,
    /<pre\b[^>]*>([\s\S]*?)<\/pre>/giu,
    match => toBlockText(match[1]),
  );
  const links = extractMatches(
    markup,
    /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/giu,
    match => ({
      href: match[1],
      text: toPlainText(match[2]) || match[1],
    }),
  );
  const buttons = extractMatches(
    markup,
    /<button\b[^>]*>([\s\S]*?)<\/button>/giu,
    match => toPlainText(match[1]),
  );
  const rootTagMatch = markup.match(/^<([a-z0-9-]+)/iu);
  const visibleText = createVisibleTextSnapshot(markup);

  return {
    buttons: dedupe(buttons),
    codeSnippets: dedupe(codeSnippets),
    headings,
    links,
    listItems: dedupe(listItems),
    preBlocks: dedupe(preBlocks),
    rootTag: rootTagMatch ? rootTagMatch[1] : "unknown",
    tagCounts: {
      buttons: buttons.length,
      code: codeSnippets.length,
      headings: headings.length,
      links: links.length,
      listItems: listItems.length,
      pre: preBlocks.length,
      sections: (markup.match(/<section\b/giu) || []).length,
    },
    visibleText,
  };
}

function createPageSummary(analysis) {
  const parts = [];
  const headingTexts = analysis.headings.map(item => item.text);

  if (headingTexts.length > 0) {
    parts.push(`The page is organized around ${headingTexts.join(" and ")}.`);
  }
  if (analysis.codeSnippets.length > 0) {
    parts.push(
      `It references ${analysis.codeSnippets.length} command${analysis.codeSnippets.length === 1 ? "" : "s"} or code snippet${analysis.codeSnippets.length === 1 ? "" : "s"}.`,
    );
  }
  if (analysis.listItems.length > 0) {
    parts.push(`It contains ${analysis.listItems.length} list item${analysis.listItems.length === 1 ? "" : "s"} of user-facing guidance.`);
  }
  if (analysis.links.length === 0 && analysis.buttons.length === 0) {
    parts.push("No navigational links or buttons are rendered in the current snapshot.");
  }

  return parts.join(" ") || "Autogenerated page context based on the rendered React tree.";
}

function formatBulletList(items, formatter = item => item) {
  if (!items || items.length === 0) {
    return "- none";
  }

  return items.map(item => `- ${formatter(item)}`).join("\n");
}

function createRoute(basePath = "") {
  return basePath ? `${basePath}/` : "/";
}

function applyBasePathToRoute(route, basePath = "") {
  const normalizedRoute = normalizeRoute(route);

  if (!basePath) {
    return normalizedRoute;
  }

  if (normalizedRoute === "/") {
    return `${basePath}/`;
  }

  return `${basePath}${normalizedRoute}`;
}

function getRouteFileSegments(route) {
  const normalizedRoute = normalizeRoute(route);

  if (normalizedRoute === "/") {
    return ["index.md"];
  }

  return [
    ...normalizedRoute.replace(/^\/+/u, "").split("/").filter(Boolean),
    "index.md",
  ];
}

function getPageDocLink(route) {
  return ["pages", ...getRouteFileSegments(route)].join("/");
}

function createSiteReadme({ generatedAt, profile }) {
  return `# AI Context Output

This directory contains Markdown files generated by \`npm run build-ai:${profile === "production" ? "prod" : profile}\`.

## Files
- \`site-context.md\` -> site-level metadata, public runtime variables, and build profile context.
- \`pages/**/index.md\` -> rendered page snapshots, extracted headings, commands, copy, and structure.

## Generated
- Timestamp: ${generatedAt}
`;
}

function createSiteContextMarkdown({
  generatedAt,
  mode,
  pageLinks,
  profile,
  publicEnvVars,
  publicPath,
  route,
  routeCount,
  title,
}) {
  return `---
kind: ai-site-context
profile: ${profile}
mode: ${mode}
title: ${title}
generated_at: ${generatedAt}
route_count: ${routeCount}
---
# Site Context

## Identity
- Title: ${title}
- Profile: ${profile}
- Mode: ${mode}
- Public path: ${publicPath}
- Primary route: ${route}

## Metadata
- OG URL: ${publicEnvVars.OG_URL || "n/a"}
- OG Title: ${publicEnvVars.OG_TITLE || "n/a"}
- OG Description: ${publicEnvVars.OG_DESCRIPTION || "n/a"}
- OG Image: ${publicEnvVars.OG_IMAGE || "n/a"}
- OG Type: ${publicEnvVars.OG_TYPE || "n/a"}

## Public Runtime Variables
${createCodeFence(JSON.stringify(publicEnvVars, null, 2), "json")}

## Pages
${pageLinks.map(item => `- \`${item.route}\` context: [${item.link}](./${item.link})`).join("\n")}
`;
}

function createPageContextMarkdown({
  analysis,
  generatedAt,
  markup,
  mode,
  profile,
  publicEnvVars,
  route,
  title,
}) {
  return `---
kind: ai-page-context
route: ${route}
profile: ${profile}
mode: ${mode}
title: ${title}
generated_at: ${generatedAt}
---
# Page Context: ${route}

## Summary
${createPageSummary(analysis)}

## Identity
- Route: ${route}
- Title: ${title}
- Profile: ${profile}
- Mode: ${mode}
- Root tag: ${analysis.rootTag}

## Structure
- Heading count: ${analysis.tagCounts.headings}
- Section count: ${analysis.tagCounts.sections}
- List item count: ${analysis.tagCounts.listItems}
- Code snippet count: ${analysis.tagCounts.code}
- Link count: ${analysis.tagCounts.links}
- Button count: ${analysis.tagCounts.buttons}
- Preformatted block count: ${analysis.tagCounts.pre}

## Heading Outline
${formatBulletList(
    analysis.headings,
    item => `H${item.level}: ${escapeMarkdown(item.text)}`,
  )}

## Commands And Code
${formatBulletList(
    analysis.codeSnippets,
    item => `\`${String(item).replace(/`/gu, "\\`")}\``,
  )}

## Links
${formatBulletList(
    analysis.links,
    item => `${escapeMarkdown(item.text)} -> ${item.href}`,
  )}

## Buttons
${formatBulletList(analysis.buttons, item => escapeMarkdown(item))}

## List Items
${formatBulletList(analysis.listItems, item => escapeMarkdown(item))}

## Public Runtime Variables
${createCodeFence(JSON.stringify(publicEnvVars, null, 2), "json")}

## Visible Text Snapshot
${createCodeFence(analysis.visibleText || "none", "text")}

## Rendered Markup Snapshot
${createCodeFence(markup, "html")}
`;
}

async function buildAiContext() {
  console.clear();
  banner();
  console.log("");

  const {
    profile,
    envVars,
    mode,
    basePath,
    publicPath,
    title,
  } = resolveProfile();
  const route = createRoute(basePath);
  const generatedAt = new Date().toISOString();
  const outputDir = getDistAiDir();
  const pagesDir = path.join(outputDir, "pages");

  success(`Building AI context with profile "${profile}" (${mode}).`);
  info(`Output: ${outputDir}`);
  console.log("");

  process.chdir(getProjectRoot());
  validateBabelDependencies();
  registerServerRenderingHooks();

  const appModule = require(getStaticAppModulePath());
  const routes = resolveStaticRoutes(appModule);
  const publicEnvVars = filterPublicEnvVars(envVars);
  const pageLinks = routes.map(currentRoute => ({
    link: getPageDocLink(currentRoute),
    route: applyBasePathToRoute(currentRoute, basePath),
  }));

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(pagesDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "README.md"),
    createSiteReadme({ generatedAt, profile }),
    "utf8",
  );
  fs.writeFileSync(
    path.join(outputDir, "site-context.md"),
    createSiteContextMarkdown({
      generatedAt,
      mode,
      pageLinks,
      profile,
      publicEnvVars,
      publicPath,
      route,
      routeCount: routes.length,
      title,
    }),
    "utf8",
  );

  routes.forEach(currentRoute => {
    const appliedRoute = applyBasePathToRoute(currentRoute, basePath);
    const markup = renderToStaticMarkup(resolveStaticElement(appModule, currentRoute));
    const analysis = analyzeMarkup(markup);
    const outputPath = path.join(pagesDir, ...getRouteFileSegments(currentRoute));

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(
      outputPath,
      createPageContextMarkdown({
        analysis,
        generatedAt,
        markup,
        mode,
        profile,
        publicEnvVars,
        route: appliedRoute,
        title,
      }),
      "utf8",
    );
  });

  success(`AI context written to ${outputDir}`);
}

buildAiContext().catch(buildError => {
  error(buildError.stack || buildError.message || String(buildError));
  process.exitCode = 1;
});
