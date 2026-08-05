// functions/api/auth/login.js
// POST /api/auth/login
import {
  verifyPassword,
  generateSessionToken,
  hashToken,
  buildSessionCookie
} from "../../_lib/auth.js";

const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// Dummy salt/hash used to run a verification even when no user is found,
// so the response time doesn't leak whether the email exists.
const DUMMY_SALT = "00000000000000000000000000000000000000000000000000000000000000";
const DUMMY_HASH = "0";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username || !password) {
    return Response.json({ error: "יש להזין שם משתמש וסיסמה." }, { status: 400 });
  }

  const user = await env.DB.prepare(
    "SELECT id, username, password_hash, password_salt, is_active FROM admin_users WHERE username = ?"
  )
    .bind(username)
    .first();

  const valid = user
    ? await verifyPassword(password, user.password_salt, user.password_hash)
    : await verifyPassword(password, DUMMY_SALT, DUMMY_HASH).catch(() => false);

  if (!user || !user.is_active || !valid) {
    return Response.json({ error: "שם משתמש או סיסמה שגויים." }, { status: 401 });
  }

  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const sessionId = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO admin_sessions (id, admin_user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
    ).bind(sessionId, user.id, tokenHash, expiresAt),
    env.DB.prepare(
      "UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(user.id)
  ]);

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", buildSessionCookie(token, SESSION_TTL_SECONDS));

  return new Response(JSON.stringify({ ok: true, username: user.username }), {
    status: 200,
    headers
  });
}
