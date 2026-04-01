/**
 * viewerTracker.js
 * In-memory real-time viewer tracking per property
 *
 * Structure: Map<propertyId, Map<sessionId, lastSeenMs>>
 * A session is considered "alive" if last heartbeat was within TIMEOUT_MS
 */

const TIMEOUT_MS = 45_000; // 45 seconds — client pings every 20s, so 45s = safe dead window

/** @type {Map<string, Map<string, number>>} */
const store = new Map();

/**
 * Record a heartbeat for a session on a property.
 * Returns the current live viewer count for that property.
 * @param {string|number} propertyId
 * @param {string} sessionId
 * @returns {number}
 */
function heartbeat(propertyId, sessionId) {
  const key = String(propertyId);
  if (!store.has(key)) {
    store.set(key, new Map());
  }
  const sessions = store.get(key);
  sessions.set(sessionId, Date.now());
  return _countLive(sessions);
}

/**
 * Get the live viewer count for a property (without recording a heartbeat).
 * @param {string|number} propertyId
 * @returns {number}
 */
function getCount(propertyId) {
  const key = String(propertyId);
  if (!store.has(key)) return 0;
  return _countLive(store.get(key));
}

/**
 * Remove a session when user leaves.
 * @param {string|number} propertyId
 * @param {string} sessionId
 */
function leave(propertyId, sessionId) {
  const key = String(propertyId);
  if (!store.has(key)) return;
  store.get(key).delete(sessionId);
}

/** Count sessions with lastSeen within TIMEOUT_MS, purging stale ones */
function _countLive(sessions) {
  const cutoff = Date.now() - TIMEOUT_MS;
  let count = 0;
  for (const [sid, ts] of sessions) {
    if (ts < cutoff) {
      sessions.delete(sid);
    } else {
      count++;
    }
  }
  return count;
}

// Periodic global cleanup every 2 minutes to prevent memory leak
setInterval(() => {
  for (const [propId, sessions] of store) {
    _countLive(sessions); // purges stale entries as side effect
    if (sessions.size === 0) store.delete(propId);
  }
}, 2 * 60 * 1000);

module.exports = { heartbeat, getCount, leave };
