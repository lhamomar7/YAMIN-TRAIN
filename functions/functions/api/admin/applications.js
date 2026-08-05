// functions/api/admin/applications.js
// GET /api/admin/applications — requires a valid admin session.
import { requireSession } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const session = await requireSession(context);
  if (!session) {
    return Response.json({ error: "נדרשת התחברות." }, { status: 401 });
  }

  const { env } = context;
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, status, full_name, email, phone, payload_json, coach_notes
     FROM applications
     ORDER BY created_at DESC
     LIMIT 200`
  ).all();

  return Response.json({ ok: true, applications: results });
}