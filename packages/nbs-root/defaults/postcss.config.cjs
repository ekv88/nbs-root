const path = require("path");
const autoprefixer = require("autoprefixer");
const tailwindcss = require("@tailwindcss/postcss");

const projectRoot = path.resolve(process.env.NBS_PROJECT_ROOT || process.cwd());

module.exports = {
  plugins: [tailwindcss({ base: projectRoot }), autoprefixer()],
};
