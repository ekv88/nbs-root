#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const { getEslintConfigPath } = require("../scripts/project-paths");

function normalizeProfile(value) {
  if (!value) {
    return value;
  }

  const aliases = {
    dev: "development",
    development: "development",
    prod: "production",
    production: "production",
    stage: "staging",
    staging: "staging",
  };

  return aliases[value] || value;
}

function parseCommandSpec(value) {
  if (!value) {
    return { command: value, profile: undefined };
  }

  const separatorIndex = value.indexOf(":");

  if (separatorIndex === -1) {
    return { command: value, profile: undefined };
  }

  return {
    command: value.slice(0, separatorIndex),
    profile: normalizeProfile(value.slice(separatorIndex + 1)),
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const commandSpec = parseCommandSpec(args.shift());
  const command = commandSpec.command;
  let profile = commandSpec.profile || process.env.ENV_PROFILE;
  const passthrough = [];

  while (args.length > 0) {
    const current = args.shift();

    if ((current === "--profile" || current === "-p") && args.length > 0) {
      profile = normalizeProfile(args.shift());
      continue;
    }

    passthrough.push(current);
  }

  return {
    command,
    passthrough,
    profile,
  };
}

function runNodeScript(scriptPath, env) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}

function runWebpackCli(cliArgs, env) {
  const webpackCliPath = require.resolve("webpack-cli/bin/cli.js");
  const configPath = path.resolve(__dirname, "..", "scripts", "webpack.config.js");
  const result = spawnSync(
    process.execPath,
    [webpackCliPath, ...cliArgs, "--config", configPath],
    {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    },
  );

  process.exit(result.status ?? 1);
}

function runEslint(cliArgs, env) {
  const eslintPackagePath = require.resolve("eslint/package.json");
  const eslintCliPath = path.resolve(
    path.dirname(eslintPackagePath),
    "bin",
    "eslint.js",
  );
  const hasCustomConfigArg = cliArgs.includes("--config") || cliArgs.includes("-c");
  const args = cliArgs.length > 0 ? [...cliArgs] : ["src/**/*.{js,jsx}"];

  if (!hasCustomConfigArg) {
    args.push("--config", getEslintConfigPath());
  }

  const result = spawnSync(process.execPath, [eslintCliPath, ...args], {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}

function printUsage() {
  console.log(`\n
Usage: nbs-root <command[:profile]> [extra args]

Commands:
  dev
  build
  build-ssg
  build-ai
  lint

Examples:
  nbs-root dev:development
  nbs-root build:production
  nbs-root build-ssg:staging
  nbs-root build-ai:prod
  nbs-root lint
`);
}

const { command, passthrough, profile } = parseArgs(process.argv.slice(2));

if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

const env = {
  ...process.env,
  NBS_PROJECT_ROOT: process.env.NBS_PROJECT_ROOT || process.cwd(),
};

if (profile) {
  env.ENV_PROFILE = profile;
}

switch (command) {
  case "dev":
    runWebpackCli(["serve", ...passthrough], env);
    break;
  case "build":
    runWebpackCli([...passthrough], env);
    break;
  case "build-ssg":
    runNodeScript(path.resolve(__dirname, "..", "scripts", "build.ssg.js"), env);
    break;
  case "build-ai":
    runNodeScript(path.resolve(__dirname, "..", "scripts", "build.ai.js"), env);
    break;
  case "lint":
    runEslint(passthrough, env);
    break;
  default:
    console.error(`Unknown command "${command}".`);
    printUsage();
    process.exit(1);
}
