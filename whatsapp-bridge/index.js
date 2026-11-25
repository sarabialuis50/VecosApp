import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, 'auth_info');
const PORT = Number(process.env.PORT || process.env.BRIDGE_PORT || 3005);
const HOST = process.env.HOST || '0.0.0.0';
const BACKEND_BRIDGE_URL =
  process.env.BACKEND_BRIDGE_URL || 'http://127.0.0.1:8000/api/whatsapp/bridge';

const state = {
  status: 'starting', // starting | qr | connected | reconnecting
  qrDataUrl: null,
  connectedPhone: null,
  connectedName: null,
  lastError: null,
  messagesHandled: 0,
};

let activeSock = null;
const processedIds = new Set();

function extractMessagePayload(msg) {
  const m = msg.message || {};
  const text =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    '';

  const loc = m.locationMessage || m.liveLocationMessage;
  const latitude = loc?.degreesLatitude ?? null;
  const longitude = loc?.degreesLongitude ?? null;
  const locText = [loc?.name, loc?.address].filter(Boolean).join(', ');

  return {
    message: [text, locText].filter(Boolean).join(' ').trim(),
    latitude,
    longitude,
  };
}

async function startWhatsApp() {
  state.status = 'starting';
  state.lastError = null;

  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: authState,
    logger: pino({ level: 'silent' }),
    browser: ['Fogón & Mesa', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });

  activeSock = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.status = 'qr';
      state.connectedPhone = null;
      state.connectedName = null;
      try {
        state.qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
        console.log(`\n[WhatsApp Bridge] Nuevo QR disponible en http://localhost:${PORT}\n`);
      } catch (err) {
        console.error('[WhatsApp Bridge] Error generando QR:', err);
      }
    }

    if (connection === 'open') {
      state.status = 'connected';
      state.qrDataUrl = null;
      state.lastError = null;
      const rawId = sock.user?.id || '';
      state.connectedPhone = rawId.split(':')[0].split('@')[0];
      state.connectedName = sock.user?.name || 'WhatsApp Conectado';
      console.log(`[WhatsApp Bridge] Conectado como +${state.connectedPhone} (${state.connectedName})`);
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      state.connectedPhone = null;
      state.connectedName = null;

      if (isLoggedOut) {
        console.log('[WhatsApp Bridge] Sesión cerrada. Limpiando auth_info y generando nuevo QR...');
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        state.status = 'reconnecting';
        setTimeout(() => startWhatsApp().catch(console.error), 1500);
      } else {
        state.status = 'reconnecting';
        state.lastError = `Desconectado (código ${statusCode || 'desconocido'}). Reconectando...`;
        console.log(`[WhatsApp Bridge] ${state.lastError}`);
        setTimeout(() => startWhatsApp().catch(console.error), 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid || '';
        if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') {
          continue;
        }

        const msgId = msg.key.id;
        if (msgId && processedIds.has(msgId)) continue;
        if (msgId) {
          processedIds.add(msgId);
          if (processedIds.size > 500) {
            const first = processedIds.values().next().value;
            processedIds.delete(first);
          }
        }

        const fromPhone = remoteJid.split('@')[0];
        const { message, latitude, longitude } = extractMessagePayload(msg);
        if (!message && latitude === null) continue;

        console.log(`[WhatsApp -> Agente] +${fromPhone}: ${message || '[GPS]'}`);
        await sock.sendPresenceUpdate('composing', remoteJid).catch(() => {});

        const res = await fetch(BACKEND_BRIDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_phone: fromPhone,
            message,
            latitude,
            longitude,
          }),
        });

        const data = await res.json();
        const reply = (data?.reply || '').trim();

        await sock.sendPresenceUpdate('paused', remoteJid).catch(() => {});

        if (reply) {
          await sock.sendMessage(remoteJid, { text: reply });
          state.messagesHandled += 1;
          console.log(`[Agente -> WhatsApp] +${fromPhone}: ${reply.slice(0, 80)}...`);
        }
      } catch (err) {
        console.error('[WhatsApp Bridge] Error procesando mensaje:', err);
      }
    }
  });
}

function renderHtml() {
  const statusBadge =
    state.status === 'connected'
      ? `<span class="badge ok">Conectado · +${state.connectedPhone}</span>`
      : state.status === 'qr'
      ? `<span class="badge warn">Esperando escaneo QR</span>`
      : `<span class="badge muted">Iniciando / Reconectando...</span>`;

  const bodyContent =
    state.status === 'connected'
      ? `
        <div class="connected-box">
          <div class="check">✓</div>
          <h2>¡WhatsApp vinculado!</h2>
          <p>Número activo: <strong>+${state.connectedPhone}</strong> (${state.connectedName})</p>
          <p class="sub">Cualquier persona que escriba a este número recibirá respuestas en vivo del agente de <strong>Fogón & Mesa (OpenAI)</strong>.</p>
          <p class="sub">Mensajes respondidos en esta sesión: <strong>${state.messagesHandled}</strong></p>
          <form method="POST" action="/logout">
            <button type="submit" class="btn-danger">Desvincular número y generar nuevo QR</button>
          </form>
        </div>
      `
      : state.qrDataUrl
      ? `
        <div class="qr-box">
          <img src="${state.qrDataUrl}" alt="Código QR de WhatsApp" />
          <ol class="steps">
            <li>Abre <strong>WhatsApp</strong> en el celular de pruebas.</li>
            <li>Ve a <strong>Dispositivos vinculados → Vincular un dispositivo</strong>.</li>
            <li>Escanea este código QR (se actualiza automáticamente).</li>
          </ol>
        </div>
      `
      : `
        <div class="loading-box">
          <p>Generando código QR de WhatsApp...</p>
          ${state.lastError ? `<p class="err">${state.lastError}</p>` : ''}
        </div>
      `;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="5" />
  <title>Puente WhatsApp · Fogón & Mesa</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #181615; color: #FBF9F5; display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .card { width: 100%; max-width: 440px; background: #231F1D; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 28px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.45); }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .subtitle { margin: 0 0 18px; color: #C9C1B8; font-size: 13px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
    .badge.ok { background: rgba(37,211,102,0.18); color: #25D366; border: 1px solid rgba(37,211,102,0.4); }
    .badge.warn { background: rgba(200,100,20,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.4); }
    .badge.muted { background: rgba(255,255,255,0.08); color: #C9C1B8; }
    .qr-box img { background: #fff; padding: 12px; border-radius: 16px; max-width: 280px; width: 100%; height: auto; }
    .steps { text-align: left; font-size: 13px; color: #C9C1B8; line-height: 1.6; margin: 18px 0 0; padding-left: 20px; }
    .connected-box .check { width: 56px; height: 56px; border-radius: 999px; background: #25D366; color: #181615; font-size: 30px; font-weight: 900; display: grid; place-items: center; margin: 0 auto 14px; }
    .sub { color: #C9C1B8; font-size: 13px; line-height: 1.5; }
    .btn-danger { margin-top: 16px; padding: 10px 18px; border-radius: 999px; border: 1px solid rgba(239,68,68,0.5); background: rgba(239,68,68,0.15); color: #FCA5A5; font-weight: 700; cursor: pointer; }
    .btn-danger:hover { background: rgba(239,68,68,0.28); }
    .err { color: #FCA5A5; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>WhatsApp Bridge · Fogón & Mesa</h1>
    <p class="subtitle">Conectado al agente de OpenAI en <code>${BACKEND_BRIDGE_URL}</code></p>
    ${statusBadge}
    ${bodyContent}
  </div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: state.status,
      connectedPhone: state.connectedPhone,
      connectedName: state.connectedName,
      messagesHandled: state.messagesHandled,
      hasQr: Boolean(state.qrDataUrl),
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/logout') {
    try {
      if (activeSock) await activeSock.logout().catch(() => {});
    } catch {}
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    state.status = 'reconnecting';
    state.qrDataUrl = null;
    state.connectedPhone = null;
    setTimeout(() => startWhatsApp().catch(console.error), 1000);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderHtml());
});

server.listen(PORT, HOST, () => {
  console.log(`[WhatsApp Bridge] Interfaz QR lista en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`[WhatsApp Bridge] Backend destino: ${BACKEND_BRIDGE_URL}`);
  startWhatsApp().catch((err) => {
    console.error('[WhatsApp Bridge] Error fatal al iniciar:', err);
  });
});
