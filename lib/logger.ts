type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, context));
    }
  },
  info: (message: string, context?: LogContext) => {
    console.log(formatLog("info", message, context));
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(formatLog("warn", message, context));
  },
  error: (message: string, context?: LogContext) => {
    console.error(formatLog("error", message, context));
  },
};

export function withRequestId(requestId: string) {
  return {
    debug: (msg: string, ctx?: LogContext) => logger.debug(msg, { requestId, ...ctx }),
    info: (msg: string, ctx?: LogContext) => logger.info(msg, { requestId, ...ctx }),
    warn: (msg: string, ctx?: LogContext) => logger.warn(msg, { requestId, ...ctx }),
    error: (msg: string, ctx?: LogContext) => logger.error(msg, { requestId, ...ctx }),
  };
}
