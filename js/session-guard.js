"use strict";

/* =========================================================
   TRAIN LIKE A PRO — ADMIN SESSION GUARD
   בודק מול השרת (cookie מסוג HttpOnly) שיש session אמיתי ותקף.
   אם ה-API עדיין לא מחובר (למשל בפיתוח מקומי עם Live Server),
   לא נועלים החוצה — רק מזהירים בקונסול, כדי לא לשבור את מצב ה-Demo.
   ========================================================= */

(async function guardAdminSession() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include"
    });

    if (response.status === 401) {
      sessionStorage.removeItem("tlap_admin_demo_session");
      window.location.replace("index.html");
    }
  } catch (error) {
    console.warn(
      "בדיקת session נכשלה (ייתכן שה-API עדיין לא מחובר ל-D1):",
      error
    );
  }
})();
