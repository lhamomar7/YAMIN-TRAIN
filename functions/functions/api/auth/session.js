// functions/api/auth/session.js
// GET /api/auth/session — used by js/session-guard.js to confirm the visitor
// is really logged in (i.e. has a valid, non-expired, non-revoked session in D1).
import { requireSession } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const session = await requireSession(context);

  if (!session) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({ authenticated: true, username: session.username });
}
