// functions/api/auth/change-password.js
// POST /api/auth/change-password — requires a valid session.
// Lets the logged-in admin change their own password (current password required).
import { requireSession, verifyPassword, hashPassword } from "../../_lib/auth.js";

const MIN_PASSWORD_LENGTH = 8;

export async function onRequestPost(context) {
  const session = await requireSession(context);
  if (!session) {
    return Response.json({ error: "נדרשת התחברות." }, { status: 401 });
  }

  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "יש להזין את הסיסמה הנוכחית ואת הסיסמה החדשה." },
      { status: 400 }
    );
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `הסיסמה החדשה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים.` },
      { status: 400 }
    );
  }

  const user = await env.DB.prepare(
    "SELECT id, password_hash, password_salt FROM admin_users WHERE id = ?"
  )
    .bind(session.userId)
    .first();

  if (!user) {
    return Response.json({ error: "משתמש לא נמצא." }, { status: 404 });
  }

  const currentValid = await verifyPassword(
    currentPassword,
    user.password_salt,
    user.password_hash
  );

  if (!currentValid) {
    return Response.json({ error: "הסיסמה הנוכחית שגויה." }, { status: 401 });
  }

  const { hash, salt } = await hashPassword(newPassword);

  await env.DB.prepare(
    "UPDATE admin_users SET password_hash = ?, password_salt = ? WHERE id = ?"
  )
    .bind(hash, salt, user.id)
    .run();

  return Response.json({ ok: true });
}
