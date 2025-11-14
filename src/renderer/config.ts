const defaultWsUrl = 'ws://localhost:18080';
const defaultBotUrl = 'http://localhost:5050/genix/ai';

export const BACKEND_WS_URL =
  typeof window !== 'undefined' && window.GENIX_BACKEND_WS_URL
    ? window.GENIX_BACKEND_WS_URL
    : defaultWsUrl;

export const GENIX_BOT_URL =
  typeof window !== 'undefined' && window.GENIX_BOT_URL
    ? window.GENIX_BOT_URL
    : defaultBotUrl;
