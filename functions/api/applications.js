// functions/api/applications.js
// POST /api/applications — same D1 that the admin project reads from.
// Replaces the old Express server.js entirely.

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 15;

const REQUIRED_FIELDS = [
  "fullName", "birthDate", "email", "phone", "weight", "height",
  "referralSource", "medicalIssues", "dailyMedication", "anabolicUse",
  "previousCoaching", "trainingType", "trainingExperience",
  "currentWeeklyTraining", "availableWeeklyTraining", "structuredPlan",
  "otherActivities", "shortTermGoal", "longTermGoal", "expectations",
  "nutritionRoutine", "dailyMeals", "proteinSources", "carbSources",
  "fatSources", "fruitVegetables", "supplements", "eatingDifficulty",
  "privacyConsent"
];

function cleanText(value, maxLength = 3000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function getClientIp(request) {
  // כותרת ייחודית ל-Cloudflare, לא ניתנת לזיוף ע"י המשתמש (לא כמו X-Forwarded-For).
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function isRateLimited(env, ip) {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const { count } = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM submission_attempts
     WHERE ip_address = ? AND created_at > ?`
  )
    .bind(ip, windowStart)
    .first();

  return count >= RATE_LIMIT_MAX_ATTEMPTS;
}

async function recordAttempt(env, ip) {
  await env.DB.prepare(
    "INSERT INTO submission_attempts (id, ip_address) VALUES (?, ?)"
  )
    .bind(crypto.randomUUID(), ip)
    .run();
}

export async function onRequestPost({ request, env }) {
  const ip = getClientIp(request);

  try {
    // נספר את הניסיון מיד, לפני הולידציה — בדיוק כמו express-rate-limit,
    // כדי שגם ניסיונות עם נתונים לא תקינים ייספרו נגד המגבלה.
    if (await isRateLimited(env, ip)) {
      return Response.json(
        { error: "יותר מדי בקשות. נסה שוב בעוד כמה דקות." },
        { status: 429 }
      );
    }

    await recordAttempt(env, ip);

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "בקשה לא תקינה." }, { status: 400 });
    }

    const missing = REQUIRED_FIELDS.filter((key) => !cleanText(body[key]));

    // eatingDifficultyDetails הוא שדה המשך מותנה — נדרש רק אם התשובה לשאלה הראשית היא "כן".
    const eatingDifficulty = cleanText(body.eatingDifficulty);
    const eatingDifficultyDetails = cleanText(body.eatingDifficultyDetails);
    if (eatingDifficulty === "כן" && !eatingDifficultyDetails) {
      missing.push("eatingDifficultyDetails");
    }

    if (missing.length) {
      return Response.json(
        { error: "חסרים שדות חובה.", fields: missing },
        { status: 400 }
      );
    }

    const email = cleanText(body.email, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "כתובת האימייל אינה תקינה." }, { status: 400 });
    }

    const phone = cleanText(body.phone, 30).replace(/\D/g, "");
    if (!/^0\d{8,9}$/.test(phone)) {
      return Response.json({ error: "מספר הטלפון אינו תקין." }, { status: 400 });
    }

    const cleaned = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, cleanText(value)])
    );
    cleaned.phone = phone;

    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO applications (id, status, full_name, email, phone, payload_json, ip_address)
       VALUES (?, 'חדש', ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        cleaned.fullName,
        email,
        phone,
        JSON.stringify(cleaned),
        ip
      )
      .run();

    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "אירעה שגיאה בשמירת השאלון." },
      { status: 500 }
    );
  }
}
