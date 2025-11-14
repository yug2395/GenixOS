/**
 * GenixBot bridges Genix Shell prompts to Google Gemini via a lightweight Node.js HTTP server.
 * POST /genix/ai with {"prompt": "..."} to receive a Gemini-generated reply.
 * Example:
 * curl -X POST http://localhost:5000/genix/ai \
 *   -H "Content-Type: application/json" \
 *   -d "{\"prompt\": \"write a c program for bubble sort\"}"
 */
// force-load fetch for all Node versions / module modes
import('node-fetch').then(({ default: fetch }) => {
  if (!globalThis.fetch) {
    globalThis.fetch = fetch;
  }
});
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  const nodeFetch = require('node-fetch');
  fetchFn = typeof nodeFetch === 'function' ? nodeFetch : nodeFetch.default;
}
if (typeof fetchFn !== 'function') {
  throw new Error('Unable to resolve a fetch implementation. Install node-fetch.');
}

const localEnvPath = path.resolve(__dirname, '.env');

const loadedEnv = dotenv.config({ path: localEnvPath });
if (loadedEnv.error) {
  dotenv.config();
}

const PORT = parseInt(process.env.GENIXBOT_PORT || '5050', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY ?? ''}`;

// Allowed frontend origins (for dev and production)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'file://', // Electron production mode
];

// Get CORS headers based on request origin
function getCorsHeaders(origin) {
  const corsHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle null/undefined origin (Electron file:// or direct requests)
  if (!origin) {
    // Allow requests without origin (Electron, curl, etc.)
    corsHeaders['Access-Control-Allow-Origin'] = '*';
    return corsHeaders;
  }

  // Check if origin is allowed (or if it's from Electron file:// protocol)
  const isAllowed =
    ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed)) ||
    origin.startsWith('file://');

  if (isAllowed) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  return corsHeaders;
}

function sendJson(res, statusCode, payload, origin, extraHeaders = {}) {
  const corsHeaders = getCorsHeaders(origin);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders,
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

async function handlePrompt(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in the environment');
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await fetchFn(
    GEMINI_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gemini API error (${response.status} ${response.statusText}): ${text}`
    );
  }

  const data = await response.json();
  const candidate =
    data?.candidates && Array.isArray(data.candidates)
      ? data.candidates[0]
      : undefined;
  const parts = candidate?.content?.parts;
  const responseText = Array.isArray(parts)
    ? parts
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .join('')
        .trim()
    : '';

  if (!responseText) {
    throw new Error('Gemini API returned an empty response');
  }

  return responseText;
}

const server = http.createServer(async (req, res) => {
  // Extract origin from request headers
  const origin = req.headers.origin || '';

  if (req.method === 'POST' && req.url === '/genix/ai') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        body = '';
        sendJson(res, 413, { error: 'Payload too large' }, origin);
        req.socket.destroy();
      }
    });

    req.on('end', async () => {
      if (!body) {
        return sendJson(res, 400, { error: 'Request body is empty' }, origin);
      }

      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (error) {
        return sendJson(res, 400, { error: 'Invalid JSON payload' }, origin);
      }

      const prompt = parsed?.prompt;
      if (typeof prompt !== 'string' || !prompt.trim()) {
        return sendJson(res, 400, { error: 'Prompt must be a non-empty string' }, origin);
      }

      try {
        const responseText = await handlePrompt(prompt.trim());
        return sendJson(res, 200, { response: responseText }, origin);
      } catch (error) {
        console.error('GenixBot error:', error);
        return sendJson(res, 500, {
          error:
            error instanceof Error ? error.message : 'Unknown GenixBot error',
        }, origin);
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Request stream error' }, origin);
      } else {
        res.destroy();
      }
    });

    return;
  }

  if (req.method === 'OPTIONS' && req.url === '/genix/ai') {
    const corsHeaders = getCorsHeaders(origin);
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  sendJson(res, 404, { error: 'Route not found' }, origin);
});

server.listen(PORT, () => {
  console.log(`GenixBot listening on port ${PORT}`);
});

module.exports = {
  server,
};

