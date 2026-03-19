const { paint } = require("./utils");

const severityLabels = {
  1: "warning",
  2: "error",
};

const FULL_MARKER = "__ESLINT_FULL__";

const formatResults = (results, limitPerFile) => {
  const lines = [];
  let totalWarnings = 0;
  let totalErrors = 0;
  let filesWithIssues = 0;

  lines.push(paint(`ESLint results (showing first ${limitPerFile} per file)`, "gray"));
  lines.push("");

  results.forEach(result => {
    const messages = Array.isArray(result.messages) ? result.messages : [];
    if (messages.length === 0) {
      return;
    }
    filesWithIssues += 1;
    const fileWarnings = messages.filter(item => item.severity === 1).length;
    const fileErrors = messages.filter(item => item.severity === 2).length;
    totalWarnings += fileWarnings;
    totalErrors += fileErrors;

    lines.push(paint(result.filePath || "Unknown file", "gray"));

    const effectiveLimit = Number.isFinite(limitPerFile) ? limitPerFile : messages.length;
    messages.slice(0, effectiveLimit).forEach(item => {
      const severity = severityLabels[item.severity] || "warning";
      const line = item.line || 0;
      const column = item.column || 0;
      const location = `${line}:${column}`.padStart(6, " ");
      const severityColor = severity === "error" ? "red" : "yellow";
      const rule = item.ruleId ? paint(item.ruleId, "gray") : "";
      const ruleText = rule ? `  ${rule}` : "";
      const messageText = paint(item.message || "Warning", "white");

      lines.push(
        `  ${paint(location, "gray")}  ${paint(severity, severityColor)}  ${messageText}${ruleText}`
      );
    });

    if (messages.length > effectiveLimit) {
      lines.push(paint(`  ... ${messages.length - effectiveLimit} more`, "gray"));
    }

    lines.push(
      `  ${paint("warnings", "yellow")}${paint(`: ${fileWarnings}`, "white")}  ${paint(
        "errors",
        "red"
      )}${paint(`: ${fileErrors}`, "white")}`
    );
    lines.push("");
  });

  lines.push(
    paint(
      `Total warnings: ${totalWarnings}, total errors: ${totalErrors} across ${filesWithIssues} file(s).`,
      "gray"
    )
  );

  return lines.join("\n");
};

module.exports = results => {
  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  const limitPerFile = Number(process.env.ESLINT_MAX_WARNINGS_PER_FILE || 2);
  const summary = formatResults(results, limitPerFile);
  const full = formatResults(results, Number.POSITIVE_INFINITY);

  return `${summary}\n${FULL_MARKER}\n${full}`;
};
