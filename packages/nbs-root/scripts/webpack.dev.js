const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const os = require("os");
const path = require("path");

const {
  createLoader,
  createWarningViewer,
  dim,
  error,
  info,
  paint,
  success,
  warn,
} = require("./utils");
const { getAssetsDir, getEslintConfigPath, getProjectRoot } = require("./project-paths");

function attachPortInUseHandler({ startupLoader, buildLoader, port, profile }) {
  const handler = caughtError => {
    if (!caughtError || caughtError.code !== "EADDRINUSE") {
      process.removeListener("uncaughtException", handler);
      throw caughtError;
    }

    startupLoader.stop({ newline: true });
    buildLoader.stop();
    error(`Port ${caughtError.port || port} is already in use.`);
    dim(
      `Free that port or set a different PORT in the "${profile}" profile inside .env-cmdrc.`,
    );
    process.exit(1);
  };

  process.prependListener("uncaughtException", handler);

  return () => {
    process.removeListener("uncaughtException", handler);
  };
}

function createDevConfig({
  profile,
  mode,
  publicPath = "/",
  basePath = "",
  port = 3000,
  openBrowser = false,
  enableReactRefresh = false,
} = {}) {
  const assetsPath = getAssetsDir();
  const startupLoader = createLoader("Starting up local server...");
  const buildLoader = createLoader("Building codebase...", { leadingNewline: true });
  const warningViewer = createWarningViewer({ limitPerFile: 2 });
  const eslintConfigPath = getEslintConfigPath();
  warningViewer.attachKeys();
  let isCompiling = false;
  const detachPortInUseHandler = attachPortInUseHandler({
    startupLoader,
    buildLoader,
    port,
    profile,
  });

  startupLoader.start();

  return {
    stats: "none",
    infrastructureLogging: {
      level: "error",
    },
    output: {
      pathinfo: true,
      publicPath,
    },
    devServer: {
      port,
      onListening(devServer) {
        if (!devServer) {
          return;
        }
        detachPortInUseHandler();
        startupLoader.stop();
        process.stdout.write("\r\x1b[1A\x1b[2K");
        buildLoader.stop({ newline: true });
        const addressInfo = devServer.server.address();
        const resolvedPort = addressInfo && addressInfo.port ? addressInfo.port : port;
        const protocol = process.env.HTTPS === "true" ? "https" : "http";
        const loopbackUrls = [
          `${protocol}://localhost:${resolvedPort}${publicPath}`,
          `${protocol}://[::1]:${resolvedPort}${publicPath}`,
        ];
        const interfaces = os.networkInterfaces();
        const networkUrls = [];
        Object.values(interfaces)
          .flat()
          .filter(Boolean)
          .forEach(details => {
            if (details.family === "IPv4" && !details.internal) {
              networkUrls.push(
                `${protocol}://${details.address}:${resolvedPort}${publicPath}`
              );
            }
          });

        info("Project is running at:");
        console.log(
          `${paint("Loopback:", "magenta")} ${paint(
            loopbackUrls.join(", "),
            "green"
          )}`
        );

        if (networkUrls.length > 0) {
          console.log(
            `${paint("On Your Network (IPv4):", "magenta")} ${paint(
              networkUrls.join(", "),
              "yellow"
            )}`
          );
        }
        console.log(
          `${paint("Project location:", "magenta")} ${paint(
            `${protocol}://${loopbackUrls[0].split("://")[1]}`,
            "green"
          )}`
        );
        console.log("");
        console.log(
          `${paint("Assets:", "blue")} ${paint(
            `Content not from webpack is served from '${assetsPath}' directory`,
            "gray"
          )}`
        );
        console.log(
          `${paint("History Fallback:", "blue")} ${paint(
            `404s will fallback to '${basePath}/index.html'`,
            "gray"
          )}`
        );
        if (isCompiling) {
          buildLoader.start();
        }
      },
      server: {
        type: process.env.HTTPS === "true" ? "https" : "http",
      },
      compress: true,
      allowedHosts: "all",
      historyApiFallback: {
        index: `${basePath}/index.html`,
      },
      static: {
        directory: assetsPath,
        publicPath: "/assets",
        serveIndex: true,
      },
      devMiddleware: {
        publicPath,
        stats: "none",
      },
      client: {
        logging: "warn",
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      hot: enableReactRefresh,
      liveReload: !enableReactRefresh,
      open: openBrowser,
    },
    plugins: [
      ...(enableReactRefresh
        ? [
            new ReactRefreshWebpackPlugin({
              overlay: true,
            }),
          ]
        : []),
      {
        apply(compiler) {
          compiler.hooks.compile.tap("CliLoader", () => {
            if (!isCompiling) {
              isCompiling = true;
              buildLoader.start();
            }
          });
          compiler.hooks.invalid.tap("CliLoader", () => {
            if (!isCompiling) {
              isCompiling = true;
              buildLoader.start();
            }
          });
          compiler.hooks.failed.tap("CliLoader", compilerError => {
            isCompiling = false;
            detachPortInUseHandler();
            startupLoader.stop();
            buildLoader.stop({ newline: true });
            error("Build failed before completion:");
            console.error(
              compilerError && (compilerError.stack || compilerError.message)
                ? compilerError.stack || compilerError.message
                : compilerError
            );
          });
          compiler.hooks.done.tap("FriendlyOutput", stats => {
            isCompiling = false;
            detachPortInUseHandler();
            buildLoader.stop({ newline: true });
            const info = stats.toJson({ all: false, errors: true, warnings: true });

            if (info.errors && info.errors.length > 0) {
              error("Build failed with errors:");
              info.errors.forEach(item => {
                console.error(item.message || item);
              });
              return;
            }

            if (info.warnings && info.warnings.length > 0) {
              warn("Compiled with warnings:");
              warningViewer.update(info.warnings);
              warningViewer.printSummary();
              warningViewer.printHint();
            }
            success("Project compiled successfully.");
          });
        },
      },
      new ESLintWebpackPlugin({
        context: getProjectRoot(),
        extensions: ["js", "jsx"],
        emitError: true,
        emitWarning: true,
        failOnError: false,
        failOnWarning: false,
        formatter: path.resolve(__dirname, "eslint-formatter.js"),
        overrideConfigFile: eslintConfigPath,
      }),
    ],
  };
}

module.exports = { createDevConfig };
