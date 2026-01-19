const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
};

function colorize(color, message) {
  return `${color}${message}${colors.reset}`;
}

function warn(message) {
  console.warn(colorize(colors.yellow, message));
}

function success(message) {
  console.log(colorize(colors.green, message));
}

function error(message) {
  console.error(colorize(colors.red, message));
}

function info(message) {
  console.log(colorize(colors.cyan, message));
}

function dim(message) {
  console.log(colorize(colors.gray, message));
}

function paint(message, colorName) {
  const color = colors[colorName] || colors.cyan;
  return colorize(color, message);
}

function normalizeWarningEntry(entry) {
  if (!entry) {
    return { file: "Unknown file", message: "" };
  }

  if (typeof entry === "string") {
    const message = entry.trim();
    const fileMatch = message.match(/([A-Z]:\\[^\\n]+|\/[^\\n]+?)(?=\\n|$)/);
    return {
      file: fileMatch ? fileMatch[1] : "Unknown file",
      message,
    };
  }

  const message = (entry.message || entry.details || entry.stack || "").trim();
  const file
    = entry.file
    || entry.moduleName
    || entry.moduleIdentifier
    || (() => {
      const match = message.match(/([A-Z]:\\[^\\n]+|\/[^\\n]+?)(?=\\n|$)/);
      return match ? match[1] : "Unknown file";
    })();

  return {
    file,
    message,
  };
}

function expandWarningEntries(entries = []) {
  const expanded = [];

  const tryParseEslint = raw => {
    if (!raw) {
      return null;
    }
    const text = raw.trim();
    const idxArray = text.indexOf("[");
    const idxObject = text.indexOf("{");
    let start = idxArray;
    if (start === -1 || (idxObject !== -1 && idxObject < start)) {
      start = idxObject;
    }
    if (start === -1) {
      return null;
    }
    let end = text.lastIndexOf("]");
    const endObject = text.lastIndexOf("}");
    if (end === -1 || endObject > end) {
      end = endObject;
    }
    if (end <= start) {
      return null;
    }
    const snippet = text.slice(start, end + 1);
    try {
      return JSON.parse(snippet);
    } catch {
      return null;
    }
  };

  entries.forEach(entry => {
    const message
      = typeof entry === "string"
        ? entry.trim()
        : entry && typeof entry.message === "string" ? entry.message.trim() : "";

    if (message) {
      const parsed = tryParseEslint(message);
      if (parsed) {
        const results = Array.isArray(parsed) ? parsed : [parsed];
        const flattened = results.flatMap(item => {
          if (!item) {
            return [];
          }
          if (Array.isArray(item.results)) {
            return item.results;
          }
          return item;
        });
        const hasEslintShape = flattened.some(item => item && item.filePath);
        if (hasEslintShape) {
          flattened.forEach(result => {
            const filePath = result.filePath || "Unknown file";
            const messages = Array.isArray(result.messages) ? result.messages : [];
            messages.forEach(item => {
              const line = item.line || 0;
              const column = item.column || 0;
              const rule = item.ruleId ? ` (${item.ruleId})` : "";
              const detail = item.message || "Warning";
              const location = line ? `${line}:${column}` : "?:?";
              expanded.push({
                file: filePath,
                message: `${location} ${detail}${rule}`,
              });
            });
          });
          return;
        }
      }
    }

    expanded.push(normalizeWarningEntry(entry));
  });

  return expanded;
}

function formatWarningMessage(message, indent = "  ") {
  if (!message) {
    return [`${indent}- (no details)`];
  }

  const lines = message.split(/\r?\n/).filter(Boolean);
  return lines.map((line, index) =>
    index === 0 ? `${indent}- ${line}` : `${indent}  ${line}`
  );
}

function formatWarnings(warnings = [], options = {}) {
  const limitPerFile = options.limitPerFile ?? 2;
  const groups = new Map();

  expandWarningEntries(warnings).forEach(entry => {
    const { file, message } = entry;
    if (!groups.has(file)) {
      groups.set(file, []);
    }
    groups.get(file).push(message);
  });

  const summaryLines = [];
  const fullLines = [];
  let totalWarnings = 0;

  for (const [file, messages] of groups) {
    totalWarnings += messages.length;

    summaryLines.push(file);
    messages.slice(0, limitPerFile).forEach(message => {
      summaryLines.push(...formatWarningMessage(message));
    });
    if (messages.length > limitPerFile) {
      summaryLines.push(`  ... ${messages.length - limitPerFile} more warning(s)`);
    }
    summaryLines.push(`  Total amount of warnings: ${messages.length}`);
    summaryLines.push("");

    fullLines.push(file);
    messages.forEach(message => {
      fullLines.push(...formatWarningMessage(message));
    });
    fullLines.push(`  Total amount of warnings: ${messages.length}`);
    fullLines.push("");
  }

  if (groups.size === 0) {
    return {
      summaryText: "",
      fullText: "",
      totalWarnings: 0,
      fileCount: 0,
    };
  }

  summaryLines.push(`Total warnings: ${totalWarnings} across ${groups.size} file(s).`);
  fullLines.push(`Total warnings: ${totalWarnings} across ${groups.size} file(s).`);

  return {
    summaryText: summaryLines.join("\n"),
    fullText: fullLines.join("\n"),
    totalWarnings,
    fileCount: groups.size,
  };
}

function createWarningViewer(options = {}) {
  let summaryText = "";
  let fullText = "";
  let hasWarnings = false;
  let isFullView = false;
  let initialized = false;
  let isRawSummary = false;

  const update = warnings => {
    isRawSummary = false;
    const raw = warnings
      .map(item => typeof item === "string" ? item : item && item.message ? item.message : "")
      .find(message => typeof message === "string" && message.includes("ESLint results"));
    if (raw) {
      summaryText = raw.trim();
      fullText = summaryText;
      hasWarnings = summaryText.length > 0;
      isRawSummary = true;
      return;
    }
    const formatted = formatWarnings(warnings, options);
    summaryText = formatted.summaryText;
    fullText = formatted.fullText;
    hasWarnings = formatted.totalWarnings > 0;
  };

  const printSummary = () => {
    if (!summaryText) {
      return;
    }
    process.stdout.write("\r\x1b[2K");
    console.log(summaryText);
  };

  const printFull = () => {
    if (!fullText) {
      return;
    }
    process.stdout.write("\r\x1b[2K");
    console.log(fullText);
  };

  const printHint = () => {
    if (!process.stdin.isTTY || !hasWarnings || isRawSummary) {
      return;
    }
    console.log(colorize(colors.gray, "Press Ctrl+A to view all warnings, Ctrl+Q to exit full view."));
  };

  const attachKeys = () => {
    if (initialized || !process.stdin.isTTY) {
      return;
    }
    initialized = true;
    const readline = require("readline");
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function" && !process.stdin.isRaw) {
      process.stdin.setRawMode(true);
    }

    const handler = (_chunk, key) => {
      if (!key) {
        return;
      }
      if (key.ctrl && key.name === "c") {
        process.exit(0);
      }
      if (key.ctrl && key.name === "a" && hasWarnings) {
        isFullView = true;
        printFull();
      } else if (key.ctrl && key.name === "q" && hasWarnings) {
        if (isFullView) {
          isFullView = false;
          printSummary();
          printHint();
        }
      }
    };

    process.stdin.on("keypress", handler);
  };

  return {
    attachKeys,
    update,
    printSummary,
    printFull,
    printHint,
  };
}

function createLoader(text = "Loading...", options = {}) {
  const interval = options.interval ?? 80;
  const highlightWidth = Math.max(1, options.highlightWidth ?? 4);
  const leadingNewline = Boolean(options.leadingNewline);
  const useTty = Boolean(process.stdout.isTTY);
  let timer = null;
  let frame = 0;
  let printedOnce = false;
  let startedOnce = false;

  const render = () => {
    if (!useTty) {
      if (!printedOnce) {
        console.log(text);
        printedOnce = true;
      }
      return;
    }
    const length = text.length || 1;
    const start = frame % length;
    let line = "";

    for (let i = 0; i < length; i += 1) {
      const distance = (i - start + length) % length;
      const char = text[i] ?? " ";
      line += distance < highlightWidth ? colorize(colors.white, char) : colorize(colors.gray, char);
    }
    process.stdout.write(`\r\x1b[2K${line}`);
    frame += 1;
  };

  const start = ({ newline } = {}) => {
    if (timer) {
      return;
    }
    const shouldNewline = typeof newline === "boolean" ? newline : leadingNewline;
    if (!startedOnce && shouldNewline) {
      process.stdout.write("\n");
    }
    startedOnce = true;
    render();
    timer = setInterval(render, interval);
  };

  const stop = ({ newline = false } = {}) => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (useTty) {
      process.stdout.write(newline ? "\r\x1b[2K\n" : "\r\x1b[2K");
    } else if (newline) {
      process.stdout.write("\n");
    }
  };

  return { start, stop };
}

function banner(title) {
  const ascii = [
    "   _  _____  ____    ___  ____  ____  ______",
    "  / |/ / _ )/ __/___/ _ \\/ __ \\/ __ \\/_  __/",
    " /    / _  |\\ \\/___/ , _/ /_/ / /_/ / / /   ",
    "/_/|_/____/___/   /_/|_|\\____/\\____/ /_/    ",
  ];
  console.log(colorize(colors.cyan, ascii.join("\n")));

  if (title) {
    console.log(colorize(colors.gray, title));
  }
}

function readEnvConfig() {
  const envFilePath = path.resolve(process.cwd(), ".env-cmdrc");

  if (!fs.existsSync(envFilePath)) {
    return { exists: false, data: {} };
  }

  const envData = JSON.parse(fs.readFileSync(envFilePath, "utf8"));
  return { exists: true, data: envData };
}

module.exports = {
  banner,
  dim,
  error,
  info,
  paint,
  createLoader,
  createWarningViewer,
  formatWarnings,
  readEnvConfig,
  success,
  warn,
};
