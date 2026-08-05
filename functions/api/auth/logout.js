// functions/api/auth/logout.js
// POST /api/auth/logout
import { getSessionToken, hashToken, buildExpiredSessionCookie } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const token = getSessionToken(request);

  if (token) {
    const tokenHash = await hashToken(token);
    await env.DB.prepare(
      "UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL"
    )
      .bind(tokenHash)
      .run();
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", buildExpiredSessionCookie());

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}