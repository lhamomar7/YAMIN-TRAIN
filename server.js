"use strict";

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// --- SECURITY FIX: data now lives OUTSIDE the folder that express.static serves,
// so it can never be reached over HTTP no matter how static serving is configured. ---
const DATA_DIR = path.join(__dirname, "..", "train-like-a-pro-data");
const DATA_FILE = path.join(DATA_DIR, "applications.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");
const MAX_BACKUPS = 30;

// Simple shared-secret protection for the admin-only status endpoint.
// Set ADMIN_TOKEN in your environment (e.g. in a .env file loaded before start,
// or `ADMIN_TOKEN=xxxxx npm start`). If it's not set, the endpoint is disabled.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: "150kb" }));
app.use(express.urlencoded({ extended: false }));

// Defense in depth: even though DATA_DIR is outside __dirname, explicitly block
// any request path that looks like it's trying to reach the data folder.
app.use((req, res, next) => {
  if (/^\/(train-like-a-pro-data|data)(\/|$)/i.test(req.path)) {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(__dirname));

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false
});

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readApplications() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function backupCurrentFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    return; // nothing to back up yet
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUPS_DIR, `applications-${stamp}.json`);
  await fs.copyFile(DATA_FILE, backupPath);

  // Prune old backups, keep only the most recent MAX_BACKUPS.
  const files = (await fs.readdir(BACKUPS_DIR))
    .filter((name) => name.startsWith("applications-") && name.endsWith(".json"))
    .sort(); // ISO-like timestamps sort chronologically as strings

  const excess = files.length - MAX_BACKUPS;
  if (excess > 0) {
    await Promise.all(
      files.slice(0, excess).map((name) => fs.unlink(path.join(BACKUPS_DIR, name)))
    );
  }
}

async function writeApplications(items) {
  await ensureDataFile();
  await backupCurrentFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

function cleanText(value, maxLength = 3000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: "ניהול הסטטוסים אינו מוגדר בשרת (חסר ADMIN_TOKEN)." });
  }
  const provided = req.get("x-admin-token") || "";
  if (provided !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "אין הרשאה." });
  }
  next();
}

app.post("/api/applications", applicationLimiter, async (req, res) => {
  try {
    const required = [
      "fullName", "birthDate", "email", "phone", "weight", "height",
      "referralSource", "medicalIssues", "dailyMedication", "anabolicUse",
      "previousCoaching", "trainingType", "trainingExperience",
      "currentWeeklyTraining", "availableWeeklyTraining", "structuredPlan",
      "otherActivities", "shortTermGoal", "longTermGoal", "expectations",
      "nutritionRoutine", "dailyMeals", "proteinSources", "carbSources",
      "fatSources", "fruitVegetables", "supplements", "eatingDifficulty",
      "privacyConsent"
    ];

    const missing = required.filter((key) => !cleanText(req.body[key]));

    // FIX (#4): eatingDifficultyDetails is a conditional follow-up field —
    // it should only be required when the person answered "כן" above.
    const eatingDifficulty = cleanText(req.body.eatingDifficulty);
    const eatingDifficultyDetails = cleanText(req.body.eatingDifficultyDetails);
    if (eatingDifficulty === "כן" && !eatingDifficultyDetails) {
      missing.push("eatingDifficultyDetails");
    }

    if (missing.length) {
      return res.status(400).json({ error: "חסרים שדות חובה.", fields: missing });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(req.body.email, 254))) {
      return res.status(400).json({ error: "כתובת האימייל אינה תקינה." });
    }

    const phone = cleanText(req.body.phone, 30).replace(/\D/g, "");
    if (!/^0\d{8,9}$/.test(phone)) {
      return res.status(400).json({ error: "מספר הטלפון אינו תקין." });
    }

    const applications = await readApplications();
    const record = {
      id: crypto.randomUUID(),
      status: "חדש",
      createdAt: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [key, cleanText(value)])
      ),
      phone
    };

    applications.unshift(record);
    await writeApplications(applications);

    return res.status(201).json({ ok: true, id: record.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "אירעה שגיאה בשמירת השאלון." });
  }
});

// FIX (#5): endpoint to update an application's status (e.g. "חדש" -> "נקבעה שיחה" -> "התקבל/נדחה").
// Protected by a shared admin token so it can't be hit by the public.
const ALLOWED_STATUSES = ["חדש", "בבדיקה", "נקבעה שיחה", "התקבל", "נדחה"];

app.patch("/api/applications/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const status = cleanText(req.body.status, 50);

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "סטטוס לא חוקי.",
        allowed: ALLOWED_STATUSES
      });
    }

    const applications = await readApplications();
    const record = applications.find((item) => item.id === id);
    if (!record) {
      return res.status(404).json({ error: "לא נמצאה הגשה עם המזהה הזה." });
    }

    record.status = status;
    record.statusUpdatedAt = new Date().toISOString();
    await writeApplications(applications);

    return res.json({ ok: true, id: record.id, status: record.status });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "אירעה שגיאה בעדכון הסטטוס." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TRAIN LIKE A PRO running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not initialize data storage:", error);
    process.exit(1);
  });