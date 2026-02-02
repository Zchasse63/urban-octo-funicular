type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type EventType = 'email_sent' | 'zip_generated' | 'episode_processed' | 'error';

interface LogMeta {
  [key: string]: unknown;
  event?: EventType;
}

/**
 * Redact sensitive email information for logging
 * Preserves first 2 chars of local part and full domain
 */
function redactEmail(email: string): string {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    // For very short local parts, just show one character
    return `${localPart[0]}***@${domain}`;
  }

  const visibleChars = localPart.slice(0, 2);
  const redactedPart = '*'.repeat(Math.min(localPart.length - 2, 6));
  return `${visibleChars}${redactedPart}@${domain}`;
}

function formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();

  // Redact email addresses in metadata
  const sanitizedMeta = meta ? { ...meta } : undefined;
  if (sanitizedMeta && 'guest_email' in sanitizedMeta && typeof sanitizedMeta.guest_email === 'string') {
    sanitizedMeta.guest_email = redactEmail(sanitizedMeta.guest_email);
  }

  const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(formatMessage('info', message, meta));
  },

  warn(message: string, meta?: LogMeta) {
    console.warn(formatMessage('warn', message, meta));
  },

  error(message: string, errorOrMeta?: Error | LogMeta, meta?: LogMeta) {
    let errorMeta: LogMeta | undefined;

    if (errorOrMeta instanceof Error) {
      // Called with (message, error, meta?)
      errorMeta = { ...meta, error: errorOrMeta.message, stack: errorOrMeta.stack, event: 'error' };
    } else if (errorOrMeta) {
      // Called with (message, meta) - extract error property if present
      const metaObj = errorOrMeta as LogMeta;
      const errorProp = metaObj.error;
      if (errorProp instanceof Error) {
        const { error: _, ...rest } = metaObj;
        errorMeta = { ...rest, error: errorProp.message, stack: errorProp.stack, event: 'error' };
      } else if (typeof errorProp === 'object' && errorProp !== null && 'message' in (errorProp as object)) {
        const { error: _, ...rest } = metaObj;
        errorMeta = { ...rest, error: (errorProp as { message: string }).message, event: 'error' };
      } else {
        errorMeta = { ...metaObj, event: 'error' };
      }
    }

    console.error(formatMessage('error', message, errorMeta));
  },

  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};
