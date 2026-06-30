type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const sensitiveKeyPattern = /api.?key|authorization|database.?url|password|secret|token/i;
const secretValuePattern = /(sk-[A-Za-z0-9_-]{8,})|(postgresql:\/\/[^\s"]+)/g;

export const logger = {
  info(message: string, context: LogContext = {}): void {
    writeLog("info", message, context);
  },

  warn(message: string, context: LogContext = {}): void {
    writeLog("warn", message, context);
  },

  error(message: string, context: LogContext = {}): void {
    writeLog("error", message, context);
  }
};

function writeLog(level: LogLevel, message: string, context: LogContext): void {
  const payload = {
    context: sanitizeLogValue(context),
    level,
    message: redactSecretText(message),
    timestamp: new Date().toISOString()
  };
  const serializedPayload = JSON.stringify(payload);

  if (level === "error") {
    console.error(serializedPayload);
    return;
  }

  if (level === "warn") {
    console.warn(serializedPayload);
    return;
  }

  console.info(serializedPayload);
}

function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSecretText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[REDACTED]" : sanitizeLogValue(entryValue)
      ])
    );
  }

  return value;
}

function redactSecretText(value: string): string {
  return value.replace(secretValuePattern, "[REDACTED]");
}
