const { paint } = require("./utils");

const severityLabels = {
  1: "warning",
  2: "error",
};

module.exports = results => {
  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  const limitPerFile = Number(process.env.ESLINT_MAX_WARNINGS_PER_FILE || 2);
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

    messages.slice(0, limitPerFile).forEach(item => {
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

    if (messages.length > limitPerFile) {
      lines.push(paint(`  ... ${messages.length - limitPerFile} more`, "gray"));
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
