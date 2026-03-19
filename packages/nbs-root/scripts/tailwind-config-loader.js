"use strict";

const path = require("path");

function normalizeCssPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

module.exports = function injectTailwindConfig(source) {
  const { configPath } = this.getOptions();

  if (!configPath || /@config\s+['"][^'"]+['"]/u.test(source)) {
    return source;
  }

  const relativeConfigPath = normalizeCssPath(
    path.relative(path.dirname(this.resourcePath), configPath),
  );

  return `@config "${relativeConfigPath}";\n${source}`;
};
