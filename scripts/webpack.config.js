const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const { merge } = require("webpack-merge");

const { banner, error, info, readEnvConfig, success, warn } = require("./utils");
const { createDevConfig } = require("./webpack.dev");
const { createProdConfig } = require("./webpack.prod");

const { exists: hasEnvFile, data: ENV } = readEnvConfig();

function createBaseConfig({
  mode,
  envVars = {},
  publicPath = "/",
  basePath = "",
  title = "my-company-v1",
} = {}) {
  const resolvedMode = mode || process.env.NODE_ENV || "development";
  const isProd = resolvedMode === "production";
  const enableReactRefresh =
    resolvedMode === "development" && process.env.ENABLE_REACT_REFRESH === "true";
  const resolvedPublicPath = publicPath || "/";

  return {
    mode: resolvedMode,
    entry: path.resolve(__dirname, "..", "src", "index"),
    output: {
      path: path.resolve(__dirname, "..", "dist"),
      filename: isProd ? "[name].[contenthash].js" : "bundle.js",
      publicPath: resolvedPublicPath,
      clean: true,
    },
    devtool: isProd ? false : "eval-cheap-module-source-map",
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }],
              ],
              plugins: [
                "babel-plugin-react-compiler",
                ...(enableReactRefresh ? ["react-refresh/babel"] : []),
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
            "postcss-loader",
          ],
        },
        {
          test: /\.(scss|sass)$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
            "postcss-loader",
            "sass-loader",
          ],
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@": path.resolve(__dirname, "..", "src"),
      },
    },
    plugins: [
      new WebpackManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: resolvedPublicPath,
      }),
      new HtmlWebpackPlugin({
        title,
        template: path.resolve(__dirname, "..", "src", "index.ejs"),
        templateParameters: {
          env: envVars,
          NODE_ENV: resolvedMode,
          title,
          basePath,
          publicPath: resolvedPublicPath,
          isProd,
        },
        minify: isProd,
      }),
    ],
  };
}

function resolveProfile() {
  if (!hasEnvFile) {
    error("Missing .env-cmdrc; cannot resolve env profile.");
    process.exit(1);
  }

  const profile = process.env.ENV_PROFILE;

  if (!profile) {
    error("No env profile provided. Set ENV_PROFILE to a profile defined in .env-cmdrc.");
    process.exit(1);
  }

  if (!ENV[profile]) {
    const available = Object.keys(ENV).filter(key => key !== "default");
    error(`Unknown env profile "${profile}". Available: ${available.join(", ")}`);
    process.exit(1);
  }

  const envVars = { ...(ENV.default || {}), ...(ENV[profile] || {}) };
  const mode = envVars.NODE_ENV;

  if (!mode) {
    error(`Env profile "${profile}" must define NODE_ENV for mode selection.`);
    process.exit(1);
  }

  if (process.env.NODE_ENV && process.env.NODE_ENV !== mode) {
    warn(`Overriding NODE_ENV=${process.env.NODE_ENV} with ${mode}.`);
  }
  process.env.NODE_ENV = mode;

  const basePathValue = process.env.BASE_PATH || envVars.BASE_PATH || "";
  const basePath = basePathValue
    ? basePathValue.startsWith("/")
      ? basePathValue
      : `/${basePathValue}`
    : "";
  const publicPath = basePath ? `${basePath}/` : "/";
  const title = process.env.APP_TITLE || envVars.APP_TITLE || "my-company-v1";
  const port = Number(process.env.PORT || envVars.PORT) || 3000;
  const openBrowserValue = process.env.OPEN_BROWSER ?? envVars.OPEN_BROWSER ?? "false";
  const openBrowser = String(openBrowserValue).toLowerCase() === "true";
  const enableReactRefresh = process.env.ENABLE_REACT_REFRESH === "true";
  const eslintLimit = envVars.ESLINT_MAX_WARNINGS_PER_FILE;

  if (eslintLimit && !process.env.ESLINT_MAX_WARNINGS_PER_FILE) {
    process.env.ESLINT_MAX_WARNINGS_PER_FILE = String(eslintLimit);
  }

  return {
    profile,
    envVars,
    mode,
    basePath,
    publicPath,
    title,
    port,
    openBrowser,
    enableReactRefresh,
  };
}

const config = () => {
  console.clear();
  banner();
  console.log("");

  const { profile, envVars, mode, basePath, publicPath, title, port, openBrowser, enableReactRefresh } =
    resolveProfile();

  if (mode === "development") {
    success(`Starting dev server with profile "${profile}" (${mode}).`);
    console.log("");
    return merge(
      createBaseConfig({
        mode,
        envVars,
        publicPath,
        basePath,
        title,
      }),
      createDevConfig({
        profile,
        mode,
        publicPath,
        basePath,
        port,
        openBrowser,
        enableReactRefresh,
      })
    );
  }

  if (mode === "production") {
    success(`Building with profile "${profile}" (${mode}).`);
    info(`Output: ${path.resolve(process.cwd(), "dist")}`);
    return merge(
      createBaseConfig({
        mode,
        envVars,
        publicPath,
        basePath,
        title,
      }),
      createProdConfig()
    );
  }

  warn(`Unknown mode "${mode}". Falling back to base config.`);
  return createBaseConfig({
    mode,
    envVars,
    publicPath,
    basePath,
    title,
  });
};

config.createBaseConfig = createBaseConfig;
module.exports = config;
