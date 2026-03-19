const reactCompiler = require("babel-plugin-react-compiler");

module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "defaults" }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [reactCompiler],
};
