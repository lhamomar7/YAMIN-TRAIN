// functions/_lib/auth.js
// Shared auth helpers for all admin Cloudflare Pages Functions.
// Uses the Web Crypto API (available natively in the Workers runtime).

const PBKDF2_ITERATIONS = 210000;
const HASH_ALGO = "SHA-256";
const KEY_LENGTH_BITS = 256;
const SESSION_COOKIE_NAME = "tlap_admin_session";

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function deriveHash(password, saltHex) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return toHex(derivedBits);
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function generateSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

// Used only by the local create-admin script — not called from request handlers.
export async function hashPassword(password) {
  const salt = generateSalt();
  const hash = await deriveHash(password, salt);
  return { hash, salt };
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const hash = await deriveHash(password, saltHex);
  return timingSafeEqualHex(hash, expectedHashHex);
}

export function generateSessionToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(digest);
}

export function getSessionToken(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildSessionCookie(token, maxAgeSeconds) {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function buildExpiredSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

// Verifies the session cookie against admin_sessions + admin_users in D1.
// Returns { userId, email, sessionId } when valid, otherwise null.
export async function requireSession({ request, env }) {
  const token = getSessionToken(request);
  if (!token) return null;

  const tokenHash = await hashToken(token);

  const session = await env.DB.prepare(
    `SELECT s.id AS session_id, s.expires_at, s.revoked_at,
            u.id AS user_id, u.username, u.is_active
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first();

  if (!session) return null;
  if (session.revoked_at) return null;
  if (!session.is_active) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;

  return {
    userId: session.user_id,
    username: session.username,
    sessionId: session.session_id
  };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;