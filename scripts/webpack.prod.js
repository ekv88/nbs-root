const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { createLoader, createWarningViewer, error, success, warn } = require("./utils");

function createProdConfig() {
  const loader = createLoader("Building codebase...", { leadingNewline: true });
  const warningViewer = createWarningViewer({ limitPerFile: 2 });
  return {
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css",
      }),
      new CompressionPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(process.cwd(), "assets"),
            to: path.resolve(process.cwd(), "dist", "assets"),
            noErrorOnMissing: true,
          },
        ],
      }),
      {
        apply(compiler) {
          compiler.hooks.compile.tap("CliLoader", () => {
            loader.start();
          });
          compiler.hooks.done.tap("CliLoader", stats => {
            loader.stop({ newline: true });
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
        extensions: ["js", "jsx"],
        emitWarning: true,
        failOnError: true,
        failOnWarning: false,
        formatter: path.resolve(__dirname, "eslint-formatter.js"),
      }),
    ],
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 12,
        maxAsyncRequests: 20,
        minSize: 20000,
        cacheGroups: {
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: "react-vendor",
            priority: 40,
            chunks: "all",
          },
          threeVendor: {
            test: /[\\/]node_modules[\\/](three|postprocessing)[\\/]/,
            name: "three-vendor",
            priority: 35,
            chunks: "all",
          },
          gsapVendor: {
            test: /[\\/]node_modules[\\/]gsap[\\/]/,
            name: "gsap-vendor",
            priority: 30,
            chunks: "all",
          },
          motionVendor: {
            test: /[\\/]node_modules[\\/]motion[\\/]/,
            name: "motion-vendor",
            priority: 25,
            chunks: "all",
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -20,
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      },
    },
  };
}

module.exports = { createProdConfig };
