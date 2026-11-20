const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/v1/health/ready';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

console.log(`🚀 Starting Health Watchdog...`);
console.log(`📍 Monitoring: ${API_URL}`);
console.log(`⏱ Interval: ${CHECK_INTERVAL_MS / 1000}s`);

let isCurrentlyDown = false;

async function checkHealth() {
  try {
    const response = await axios.get(API_URL, { timeout: 10000 });
    const { status, services } = response.data;

    if (status === 'ok') {
      if (isCurrentlyDown) {
        await sendAlert(`✅ <b>Barmeh System Restored!</b>\nAll services (DB, Redis, ES) are back online.`);
        isCurrentlyDown = false;
      }
      console.log(`[${new Date().toISOString()}] Health OK`);
    } else {
      await sendAlert(`⚠️ <b>Barmeh System Degraded!</b>\nStatus: ${status}\nServices: ${JSON.stringify(services)}`);
    }
  } catch (error) {
    isCurrentlyDown = true;
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[${new Date().toISOString()}] Health check FAILED!`);
    await sendAlert(`🚨 <b>Barmeh System CRITICAL!</b>\n\nAPI is non-responsive or returned an error.\n\nDetails: <code>${errorDetails}</code>`);
  }
}

async function sendAlert(message) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn('Telegram config missing. Alert suppressed:', message);
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (e) {
    console.error('Failed to send Telegram alert:', e.message);
  }
}

checkHealth();

setInterval(checkHealth, CHECK_INTERVAL_MS);
