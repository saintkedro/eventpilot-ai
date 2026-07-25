type LogMeta = Record<string, unknown>;

function write(level: "info" | "error", message: string, meta?: LogMeta) {
  const line = JSON.stringify({
    level,
    message,
    ts: new Date().toISOString(),
    ...meta,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function logInfo(message: string, meta?: LogMeta) {
  write("info", message, meta);
}

export function logError(message: string, meta?: LogMeta) {
  write("error", message, meta);
}
