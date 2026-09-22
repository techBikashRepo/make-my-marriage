type LogLevel = "info" | "warn" | "error";

export type LogContext = Readonly<{
  requestId?: string;
  userId?: string;
  weddingId?: string;
  method?: string;
  route?: string;
  action?: string;
  status?: number;
  durationMs?: number;
}>;

function writeLog(level: LogLevel, message: string, context: LogContext): void {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });

  if (level === "error") {
    console.error(record);
    return;
  }

  if (level === "warn") {
    console.warn(record);
    return;
  }

  console.info(record);
}

export const logger = {
  info(message: string, context: LogContext = {}): void {
    writeLog("info", message, context);
  },
  warn(message: string, context: LogContext = {}): void {
    writeLog("warn", message, context);
  },
  error(message: string, context: LogContext = {}): void {
    writeLog("error", message, context);
  },
};
