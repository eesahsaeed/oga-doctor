import cron from 'node-cron';

const DEFAULT_PING_URL = 'https://ogadoctor-backend.onrender.com/api/ping';

export function startKeepAliveCron() {
  const enabled = process.env.KEEP_ALIVE_ENABLED !== 'false';
  if (!enabled) {
    console.log('[keep-alive] Disabled');
    return null;
  }

  const renderExternal = process.env.RENDER_EXTERNAL_URL;
  const pingUrl =
    process.env.KEEP_ALIVE_URL ||
    (renderExternal ? `${renderExternal.replace(/\/$/, '')}/api/ping` : DEFAULT_PING_URL);

  const task = cron.schedule('*/10 * * * *', async () => {
    try {
      const res = await fetch(pingUrl, { method: 'GET' });
      console.log(`[keep-alive] ${pingUrl} -> ${res.status}`);
    } catch (error) {
      console.error(`[keep-alive] Failed to ping ${pingUrl}:`, error?.message || error);
    }
  });

  console.log(`[keep-alive] Cron scheduled every 10 minutes: ${pingUrl}`);
  return task;
}
