"use strict";

const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const togglePasswordButton = document.getElementById("togglePassword");
const rememberMeInput = document.getElementById("rememberMe");
const loginMessage = document.getElementById("loginMessage");

if (sessionStorage.getItem("tlap_admin_demo_session") === "active") {
  window.location.replace("dashboard.html");
}

togglePasswordButton.addEventListener("click", () => {
  const visible = passwordInput.type === "text";
  passwordInput.type = visible ? "password" : "text";
  togglePasswordButton.textContent = visible ? "הצגה" : "הסתרה";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  if (!username) {
    usernameError.textContent = "יש להזין שם משתמש.";
    valid = false;
  }
  if (!password) {
    passwordError.textContent = "יש להזין סיסמה.";
    valid = false;
  }
  if (!valid) return;

  setLoading(true);
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      loginMessage.textContent = data.error || "שם המשתמש או הסיסמה אינם נכונים.";
      loginMessage.className = "form-message error";
      return;
    }

    // הערה: את ההרשאה בפועל שומר השרת ב-cookie מסוג HttpOnly (לא נגיש ל-JS).
    // הדגל הזה משמש רק לניתוב נוח בצד הלקוח בין המסכים; ה-API עצמו מוגן
    // גם אם הדגל הזה נמחק או משתנה באופן ידני.
    sessionStorage.setItem("tlap_admin_demo_session", "active");
    sessionStorage.setItem("tlap_admin_username", data.username || username);

    if (rememberMeInput.checked) {
      localStorage.setItem("tlap_admin_remember_username", username);
    } else {
      localStorage.removeItem("tlap_admin_remember_username");
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "אירעה שגיאה במהלך ההתחברות. נסה שוב.";
    loginMessage.className = "form-message error";
  } finally {
    setLoading(false);
  }
});

function clearMessages() {
  usernameError.textContent = "";
  passwordError.textContent = "";
  loginMessage.textContent = "";
  loginMessage.className = "form-message";
}

function setLoading(isLoading) {
  const button = form.querySelector('button[type="submit"]');
  form.querySelector(".button-text").hidden = isLoading;
  form.querySelector(".button-loading").hidden = !isLoading;
  button.disabled = isLoading;
}

const rememberedUsername = localStorage.getItem("tlap_admin_remember_username");
if (rememberedUsername) {
  usernameInput.value = rememberedUsername;
  rememberMeInput.checked = true;
}
