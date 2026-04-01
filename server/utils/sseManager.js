/**
 * sseManager.js
 * จัดการ Server-Sent Events (SSE) connections
 * ─────────────────────────────────────────
 * userClients  : Map<userId, Set<res>>  → เก็บ user connections
 * adminClients : Set<res>               → เก็บ admin connections
 */

const userClients  = new Map(); // userId (int) → Set of SSE response objects
const adminClients = new Set(); // SSE response objects ของ admin

// ─── ลงทะเบียน user client ───────────────────────────────────
function addUserClient(userId, res) {
  if (!userClients.has(userId)) userClients.set(userId, new Set());
  userClients.get(userId).add(res);
}
function removeUserClient(userId, res) {
  const set = userClients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) userClients.delete(userId);
}

// ─── ลงทะเบียน admin client ──────────────────────────────────
function addAdminClient(res) {
  adminClients.add(res);
}
function removeAdminClient(res) {
  adminClients.delete(res);
}

// ─── ส่ง event ให้ user คนเดียว ──────────────────────────────
function pushToUser(userId, event, data) {
  const set = userClients.get(Number(userId));
  if (!set || set.size === 0) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  set.forEach(res => {
    try { res.write(msg); } catch (_) {}
  });
}

// ─── ส่ง event ให้ admin ทุกคนที่ online ────────────────────
function pushToAdmins(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  adminClients.forEach(res => {
    try { res.write(msg); } catch (_) {}
  });
}

// ─── Helper: ตั้งค่า SSE response headers ───────────────────
function initSSE(res) {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // สำหรับ nginx
  res.flushHeaders?.();
}

// ─── Heartbeat ทุก 25 วินาที (ป้องกัน proxy timeout) ────────
function startHeartbeat(res) {
  const timer = setInterval(() => {
    try { res.write(': ping\n\n'); }
    catch (_) { clearInterval(timer); }
  }, 25_000);
  return timer;
}

module.exports = {
  addUserClient,
  removeUserClient,
  addAdminClient,
  removeAdminClient,
  pushToUser,
  pushToAdmins,
  initSSE,
  startHeartbeat,
};
