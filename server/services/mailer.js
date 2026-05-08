import nodemailer from 'nodemailer';

let cachedTransport = null;
let cachedTransportKey = '';

function isTestRuntime() {
  return (
    String(process.env.NODE_ENV || '')
      .trim()
      .toLowerCase() === 'test'
  );
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function getMailerConfig() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const from = String(process.env.MAIL_FROM || user || '').trim();
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = normalizeBoolean(
    process.env.SMTP_SECURE,
    Number.isFinite(port) ? port === 465 : true,
  );

  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    user,
    pass,
    from,
  };
}

export function isMailerConfigured() {
  if (isTestRuntime()) {
    return false;
  }

  const config = getMailerConfig();
  return Boolean(config.host && config.user && config.pass && config.from);
}

function getTransport() {
  const config = getMailerConfig();
  const cacheKey = JSON.stringify({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
  });

  if (cachedTransport && cachedTransportKey === cacheKey) {
    return { transport: cachedTransport, config };
  }

  cachedTransport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  cachedTransportKey = cacheKey;

  return { transport: cachedTransport, config };
}

export async function sendMail({ to, subject, text, html }) {
  if (!isMailerConfigured()) {
    throw new Error('SMTP mailer is not configured.');
  }

  const { transport, config } = getTransport();
  return transport.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });
}
