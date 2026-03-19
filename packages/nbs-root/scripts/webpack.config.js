const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const { merge } = require("webpack-merge");

const {
  banner,
  error,
  filterPublicEnvVars,
  info,
  readEnvConfig,
  serializeWindowEnvValue,
  success,
  warn,
} = require("./utils");
const {
  getBabelConfigPath,
  getAppModulePath,
  getDistDir,
  getEntryFile,
  getPostcssConfigPath,
  getSrcDir,
  getStyleEntryPath,
  getTailwindConfigPath,
  getTemplatePath,
} = require("./project-paths");
const { createDevConfig } = require("./webpack.dev");
const { createProdConfig } = require("./webpack.prod");

const { exists: hasEnvFile, data: ENV } = readEnvConfig();

function createBaseConfig({
  mode,
  envVars = {},
  publicPath = "/",
  basePath = "",
  title = "Company title",
} = {}) {
  const resolvedMode = mode || process.env.NODE_ENV || "development";
  const isProd = resolvedMode === "production";
  const enableReactRefresh =
    resolvedMode === "development" &&
    process.env.ENABLE_REACT_REFRESH === "true";
  const resolvedPublicPath = publicPath || "/";
  const publicEnvVars = filterPublicEnvVars(envVars);
  const srcDir = getSrcDir();
  const babelConfigPath = getBabelConfigPath();
  const postcssConfigPath = getPostcssConfigPath();
  const tailwindConfigPath = getTailwindConfigPath();

  const createTailwindConfigLoader = () =>
    tailwindConfigPath
      ? [
          {
            loader: path.resolve(__dirname, "tailwind-config-loader.js"),
            options: {
              configPath: tailwindConfigPath,
            },
          },
        ]
      : [];

  const createStyleLoaders = () => [
    isProd ? MiniCssExtractPlugin.loader : "style-loader",
    "css-loader",
    ...createTailwindConfigLoader(),
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          config: postcssConfigPath,
        },
      },
    },
  ];

  return {
    mode: resolvedMode,
    entry: getEntryFile(),
    output: {
      path: getDistDir(),
      filename: isProd ? "js/[name].[contenthash].js" : "js/bundle.js",
      chunkFilename: isProd
        ? "js/[name].[contenthash].chunk.js"
        : "js/[name].chunk.js",
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
              babelrc: false,
              cacheDirectory: true,
              configFile: babelConfigPath,
              plugins: [
                ...(enableReactRefresh ? ["react-refresh/babel"] : []),
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: createStyleLoaders(),
        },
        {
          test: /\.(scss|sass)$/,
          use: [
            ...createStyleLoaders(),
            "sass-loader",
          ],
        },
        {
          test: /\.svg$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@": srcDir,
        __NBS_APP_MODULE__: getAppModulePath(),
        __NBS_STYLE_ENTRY__: getStyleEntryPath(),
      },
    },
    plugins: [
      new WebpackManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: resolvedPublicPath,
      }),
      new HtmlWebpackPlugin({
        title,
        template: getTemplatePath(),
        templateParameters: {
          env: publicEnvVars,
          NODE_ENV: resolvedMode,
          title,
          basePath,
          publicPath: resolvedPublicPath,
          isProd,
          serializeWindowEnvValue,
        },
        minify: isProd
          ? {
              collapseWhitespace: true,
              keepClosingSlash: true,
              minifyCSS: true,
              minifyJS: false,
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
            }
          : false,
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
    error(
      "No env profile provided. Set ENV_PROFILE to a profile defined in .env-cmdrc.",
    );
    process.exit(1);
  }

  if (!ENV[profile]) {
    const available = Object.keys(ENV).filter((key) => key !== "default");
    error(
      `Unknown env profile "${profile}". Available: ${available.join(", ")}`,
    );
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
  const openBrowserValue =
    process.env.OPEN_BROWSER ?? envVars.OPEN_BROWSER ?? "false";
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

  const {
    profile,
    envVars,
    mode,
    basePath,
    publicPath,
    title,
    port,
    openBrowser,
    enableReactRefresh,
  } = resolveProfile();

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
      }),
    );
  }

  if (mode === "production") {
    success(`Building with profile "${profile}" (${mode}).`);
    info(`Output: ${getDistDir()}`);
    return merge(
      createBaseConfig({
        mode,
        envVars,
        publicPath,
        basePath,
        title,
      }),
      createProdConfig(),
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
config.resolveProfile = resolveProfile;
module.exports = config;
