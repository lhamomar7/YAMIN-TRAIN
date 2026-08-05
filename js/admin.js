/* =========================================================
   APPLICATION DRAWER + NOTES + COMMUNICATION
   ========================================================= */
"use strict";

/* =========================================================
   TRAIN LIKE A PRO — ADMIN STAGE 1
   Local demo CRM. Replace localStorage with Cloudflare D1 API later.
   ========================================================= */

if (
  sessionStorage.getItem("tlap_admin_demo_session") !== "active"
) {
  window.location.replace("index.html");
}

/* =========================================================
   LOGOUT + CLIENT SITE LINK
   (היו ללא חיווט בכלל — לחיצה עליהם לא עשתה שום דבר)
   ========================================================= */

const logoutButton =
  document.getElementById("logoutButton");

logoutButton?.addEventListener(
  "click",
  async () => {
    logoutButton.disabled = true;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.warn(
        "קריאת ההתנתקות לשרת נכשלה (ממשיכים להתנתק מקומית בכל זאת):",
        error
      );
    } finally {
      sessionStorage.removeItem(
        "tlap_admin_demo_session"
      );
      sessionStorage.removeItem(
        "tlap_admin_username"
      );

      window.location.replace(
        "index.html"
      );
    }
  }
);

// TODO: עדכן לכתובת האמיתית של אתר הלקוחות (דומיין נפרד מהאדמין).
const CLIENT_SITE_URL =
  "https://trainlikeapro.co.il";

const clientSiteLink =
  document.getElementById(
    "clientSiteLink"
  );

if (clientSiteLink) {
  clientSiteLink.href = CLIENT_SITE_URL;
}

/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

const changePasswordForm =
  document.getElementById(
    "changePasswordForm"
  );

const changePasswordMessage =
  document.getElementById(
    "changePasswordMessage"
  );

changePasswordForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    changePasswordMessage.textContent =
      "";
    changePasswordMessage.className =
      "form-message";

    const currentPassword =
      document.getElementById(
        "currentPasswordInput"
      ).value;

    const newPassword =
      document.getElementById(
        "newPasswordInput"
      ).value;

    const confirmPassword =
      document.getElementById(
        "confirmPasswordInput"
      ).value;

    if (
      newPassword !==
      confirmPassword
    ) {
      changePasswordMessage.textContent =
        "הסיסמה החדשה ואימות הסיסמה אינם תואמים.";
      changePasswordMessage.className =
        "form-message error";
      return;
    }

    if (newPassword.length < 8) {
      changePasswordMessage.textContent =
        "הסיסמה החדשה חייבת להכיל לפחות 8 תווים.";
      changePasswordMessage.className =
        "form-message error";
      return;
    }

    const submitButton =
      document.getElementById(
        "changePasswordButton"
      );

    submitButton.disabled = true;

    try {
      const response = await fetch(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        changePasswordMessage.textContent =
          data.error ||
          "אירעה שגיאה בעדכון הסיסמה.";
        changePasswordMessage.className =
          "form-message error";
        return;
      }

      changePasswordMessage.textContent =
        "הסיסמה עודכנה בהצלחה.";
      changePasswordMessage.className =
        "form-message success";

      changePasswordForm.reset();
    } catch (error) {
      console.error(error);
      changePasswordMessage.textContent =
        "אירעה שגיאה בתקשורת עם השרת.";
      changePasswordMessage.className =
        "form-message error";
    } finally {
      submitButton.disabled = false;
    }
  }
);

const STORAGE_KEYS = {
  settings: "tlap_admin_settings",
  applications: "tlap_admin_applications",
  tasks: "tlap_admin_tasks",
  events: "tlap_admin_events",
  activity: "tlap_admin_activity",
  lastSaved: "tlap_admin_last_saved"
};

function openApplication(id) {
  const application =
    getApplication(id);

  if (!application) {
    return;
  }

  state.selectedApplicationId =
    application.id;

  $("#drawerTitle").textContent =
    application.fullName;

  $("#drawerSubtitle").textContent =
    `${application.goal} · ${application.phone}`;

  $("#drawerStatus").value =
    application.status;

  const details = [
    ["טלפון", application.phone],
    ["אימייל", application.email],
    ["מטרה", application.goal],
    ["מקור", application.source],
    ["גיל", application.age],
    [
      "ניסיון",
      application.trainingExperience
    ],
    [
      "אימונים שבועיים",
      application.weeklyTraining
    ],
    [
      "מצב רפואי",
      application.medicalIssues
    ],
    [
      "ציפיות",
      application.expectations
    ],
    [
      "תאריך שליחה",
      formatDate(
        application.createdAt
      )
    ]
  ];

  $("#drawerContent").innerHTML =
    details
      .map(
        ([label, value]) => `
          <div class="detail">
            <span>
              ${escapeHtml(label)}
            </span>

            <strong>
              ${escapeHtml(
                value || "לא צוין"
              )}
            </strong>
          </div>
        `
      )
      .join("");

  renderNotesTimeline();
  renderClientTasks();
  renderCommunicationTemplates();
  renderActivity();
  activateDrawerTab("general");

  const drawer =
    $("#applicationDrawer");

  drawer.classList.add("open");

  drawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "drawer-open"
  );
}

function closeDrawer() {
  const drawer =
    $("#applicationDrawer");

  drawer?.classList.remove(
    "open"
  );

  drawer?.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "drawer-open"
  );
}

function activateDrawerTab(name) {
  $$(".drawer-tab").forEach(
    (button) =>
      button.classList.toggle(
        "active",
        button.dataset.drawerTab ===
          name
      )
  );

  $$(".drawer-tab-panel").forEach(
    (panel) =>
      panel.classList.toggle(
        "active",
        panel.dataset.drawerPanel ===
          name
      )
  );
}

$$(".drawer-tab").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () =>
        activateDrawerTab(
          button.dataset.drawerTab
        )
    );
  }
);

$("#saveApplicationButton")?.addEventListener(
  "click",
  () => {
    const application =
      getApplication(
        state.selectedApplicationId
      );

    if (!application) {
      return;
    }

    const nextStatus =
      $("#drawerStatus").value;

    const previousStatus =
      application.status;

    application.status =
      nextStatus;

    application.updatedAt =
      new Date().toISOString();

    if (
      previousStatus !==
      nextStatus
    ) {
      addActivity(
        `${application.fullName}: הסטטוס שונה מ־${previousStatus} ל־${nextStatus}`,
        "status",
        application.id
      );
    }

    saveAll({
      silent: true
    });

    renderAllBusinessData();

    showToast(
      "הסטטוס נשמר"
    );
  }
);

function renderNotesTimeline() {
  const container =
    $("#notesTimeline");

  const application =
    getApplication(
      state.selectedApplicationId
    );

  if (
    !container ||
    !application
  ) {
    return;
  }

  const notes = [
    ...(application.notes || [])
  ].sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

  container.innerHTML =
    notes.length
      ? notes
          .map(
            (note) => `
              <article class="timeline-note">
                <time>
                  ${formatDateTime(note.createdAt)}
                </time>

                <p>
                  ${escapeHtml(note.text)}
                </p>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            עדיין לא נוספו הערות.
          </div>
        `;
}

$("#noteForm")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const application =
      getApplication(
        state.selectedApplicationId
      );

    const textarea =
      $("#newNoteText");

    const text =
      textarea?.value.trim();

    if (
      !application ||
      !text
    ) {
      return;
    }

    application.notes ||= [];

    application.notes.unshift({
      id: createId("note"),
      text,
      createdAt:
        new Date().toISOString()
    });

    application.coachNotes =
      text;

    application.updatedAt =
      new Date().toISOString();

    textarea.value = "";

    addActivity(
      `${application.fullName}: נוספה הערת מאמן`,
      "note",
      application.id
    );

    saveAll({
      silent: true
    });

    renderNotesTimeline();

    showToast(
      "ההערה נוספה"
    );
  }
);

$("#clientTaskForm")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const title =
      $("#clientTaskTitle")
        .value
        .trim();

    const dueDate =
      $("#clientTaskDate").value ||
      dateOffset(0);

    if (
      !title ||
      !state.selectedApplicationId
    ) {
      return;
    }

    state.tasks.unshift({
      id: createId("task"),
      title,
      applicationId:
        state.selectedApplicationId,
      dueDate,
      dueTime:
        $("#clientTaskTime").value,
      priority: "normal",
      completed: false,
      createdAt:
        new Date().toISOString()
    });

    $("#clientTaskTitle").value =
      "";

    $("#clientTaskDate").value =
      "";

    $("#clientTaskTime").value =
      "";

    addActivity(
      `נוספה משימה ל־${applicationName(state.selectedApplicationId)}: ${title}`,
      "task",
      state.selectedApplicationId
    );

    saveAll({
      silent: true
    });

    renderTasksEverywhere();

    showToast(
      "המשימה נוספה ללקוח"
    );
  }
);

function replaceTemplateVariables(
  text,
  application
) {
  return String(text).replaceAll(
    "{name}",
    application?.fullName || ""
  );
}

function renderCommunicationTemplates() {
  const application =
    getApplication(
      state.selectedApplicationId
    );

  if (!application) {
    return;
  }

  const whatsappKey =
    $("#whatsappTemplateSelect")
      ?.value || "intro";

  const emailKey =
    $("#emailTemplateSelect")
      ?.value || "intro";

  const emailTemplate =
    emailTemplates[emailKey];

  $("#whatsappMessage").value =
    replaceTemplateVariables(
      whatsappTemplates[
        whatsappKey
      ],
      application
    );

  $("#emailSubject").value =
    replaceTemplateVariables(
      emailTemplate.subject,
      application
    );

  $("#emailMessage").value =
    replaceTemplateVariables(
      emailTemplate.body,
      application
    );
}

$("#whatsappTemplateSelect")?.addEventListener(
  "change",
  renderCommunicationTemplates
);

$("#emailTemplateSelect")?.addEventListener(
  "change",
  renderCommunicationTemplates
);

$("#openWhatsappButton")?.addEventListener(
  "click",
  () => {
    const application =
      getApplication(
        state.selectedApplicationId
      );

    if (!application) {
      return;
    }

    let phone =
      application.phone.replace(
        /\D/g,
        ""
      );

    if (
      phone.startsWith("0")
    ) {
      phone =
        `972${phone.slice(1)}`;
    }

    const message =
      $("#whatsappMessage")
        .value
        .trim();

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );

    addActivity(
      `${application.fullName}: נפתחה הודעת WhatsApp`,
      "communication",
      application.id
    );
  }
);

$("#openEmailButton")?.addEventListener(
  "click",
  () => {
    const application =
      getApplication(
        state.selectedApplicationId
      );

    if (!application?.email) {
      showToast(
        "לא הוגדרה כתובת אימייל ללקוח"
      );

      return;
    }

    const subject =
      $("#emailSubject")
        .value
        .trim();

    const body =
      $("#emailMessage")
        .value
        .trim();

    window.location.href =
      `mailto:${encodeURIComponent(application.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    addActivity(
      `${application.fullName}: נפתחה טיוטת אימייל`,
      "communication",
      application.id
    );
  }
);

document.addEventListener(
  "click",
  (event) => {
    const openButton =
      event.target.closest(
        "[data-open-application]"
      );

    if (openButton) {
      openApplication(
        openButton.dataset.openApplication
      );
    }

    if (
      event.target.closest(
        "[data-close-drawer]"
      )
    ) {
      closeDrawer();
    }
  }
);

/* =========================================================
   EXPORTS
   ========================================================= */

function exportRows() {
  return filteredApplications().map(
    (item) => ({
      "שם מלא": item.fullName,
      "אימייל": item.email,
      "טלפון": item.phone,
      "מטרה": item.goal,
      "מקור": item.source,
      "סטטוס": item.status,
      "תאריך":
        formatDate(item.createdAt),
      "ניסיון":
        item.trainingExperience,
      "מצב רפואי":
        item.medicalIssues,
      "ציפיות":
        item.expectations
    })
  );
}

function exportCsv() {
  const rows =
    exportRows();

  if (!rows.length) {
    return showToast(
      "אין נתונים לייצוא"
    );
  }

  const headers =
    Object.keys(rows[0]);

  const quote = (value) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  const csv = [
    headers
      .map(quote)
      .join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          quote(row[header])
        )
        .join(",")
    )
  ].join("\n");

  downloadBlob(
    `\uFEFF${csv}`,
    "text/csv;charset=utf-8",
    `train-like-a-pro-applications-${dateOffset(0)}.csv`
  );

  addActivity(
    "בוצע ייצוא פניות ל־CSV",
    "export"
  );

  showToast(
    "קובץ CSV נוצר"
  );
}

function exportExcel() {
  const rows =
    exportRows();

  if (!rows.length) {
    return showToast(
      "אין נתונים לייצוא"
    );
  }

  if (
    typeof XLSX ===
    "undefined"
  ) {
    showToast(
      "ספריית Excel לא נטענה — נוצר CSV במקום"
    );

    exportCsv();
    return;
  }

  const worksheet =
    XLSX.utils.json_to_sheet(
      rows
    );

  worksheet["!cols"] =
    Object.keys(rows[0]).map(
      () => ({
        wch: 22
      })
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Applications"
  );

  XLSX.writeFile(
    workbook,
    `train-like-a-pro-applications-${dateOffset(0)}.xlsx`
  );

  addActivity(
    "בוצע ייצוא פניות ל־Excel",
    "export"
  );

  showToast(
    "קובץ Excel נוצר"
  );
}

function exportPdf() {
  const rows =
    exportRows();

  if (!rows.length) {
    return showToast(
      "אין נתונים לייצוא"
    );
  }

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1100,height=760"
    );

  if (!printWindow) {
    showToast(
      "הדפדפן חסם את חלון ה־PDF"
    );

    return;
  }

  const tableRows =
    rows
      .map(
        (row) => `
          <tr>
            <td>
              ${escapeHtml(row["שם מלא"])}
            </td>

            <td>
              ${escapeHtml(row["טלפון"])}
            </td>

            <td>
              ${escapeHtml(row["מטרה"])}
            </td>

            <td>
              ${escapeHtml(row["מקור"])}
            </td>

            <td>
              ${escapeHtml(row["סטטוס"])}
            </td>

            <td>
              ${escapeHtml(row["תאריך"])}
            </td>
          </tr>
        `
      )
      .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>דוח פניות</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111;
          }

          h1 {
            margin: 0 0 6px;
          }

          p {
            color: #555;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: 9px;
            text-align: right;
            font-size: 12px;
          }

          th {
            background: #eee;
          }

          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <h1>
          TRAIN LIKE A PRO — דוח פניות
        </h1>

        <p>
          ${formatLongDate(new Date())}
        </p>

        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>טלפון</th>
              <th>מטרה</th>
              <th>מקור</th>
              <th>סטטוס</th>
              <th>תאריך</th>
            </tr>
          </thead>

          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <script>
          window.onload = () => {
            window.print();
          };
        <\/script>
      </body>
    </html>
  `);

  printWindow.document.close();

  addActivity(
    "נפתח דוח פניות לשמירה כ־PDF",
    "export"
  );
}

$("#exportCsvButton")?.addEventListener(
  "click",
  exportCsv
);

$("#exportExcelButton")?.addEventListener(
  "click",
  exportExcel
);

$("#exportPdfButton")?.addEventListener(
  "click",
  exportPdf
);

/* =========================================================
   SETTINGS + AUTOSAVE + PREVIEW
   ========================================================= */

function getSetting(path) {
  return path
    .split(".")
    .reduce(
      (current, key) =>
        current?.[key],
      state.settings
    );
}

function setSetting(
  path,
  value
) {
  const keys =
    path.split(".");

  const last =
    keys.pop();

  const target =
    keys.reduce(
      (current, key) => {
        current[key] ||= {};

        return current[key];
      },
      state.settings
    );

  target[last] = value;
}

function populateSettings() {
  $$("[data-setting]").forEach(
    (input) => {
      input.value =
        getSetting(
          input.dataset.setting
        ) ?? "";
    }
  );

  updateDesignPreview();
}

function updateDesignPreview() {
  const preview =
    $("#livePreview");

  if (!preview) {
    return;
  }

  preview.style.setProperty(
    "--preview-gold",
    state.settings.design.gold
  );

  preview.style.setProperty(
    "--preview-background",
    state.settings.design.background
  );

  preview.style.setProperty(
    "--preview-text",
    state.settings.design.text
  );

  preview.style.setProperty(
    "--preview-muted",
    state.settings.design.muted
  );
}

$$("[data-setting]").forEach(
  (input) => {
    input.addEventListener(
      "input",
      () => {
        setSetting(
          input.dataset.setting,
          input.value
        );

        updateDesignPreview();
        scheduleAutosave();
      }
    );
  }
);

$$(".section-tab").forEach(
  (tab) => {
    tab.addEventListener(
      "click",
      () => {
        $$(".section-tab").forEach(
          (item) =>
            item.classList.toggle(
              "active",
              item === tab
            )
        );

        $$(".section-editor").forEach(
          (panel) =>
            panel.classList.toggle(
              "active",
              panel.dataset.sectionPanel ===
                tab.dataset.section
            )
        );
      }
    );
  }
);

/* =========================================================
   MEDIA + QUESTIONNAIRE
   ========================================================= */

const questionSamples = [
  [
    "שם מלא",
    "טקסט קצר",
    true
  ],
  [
    "תאריך לידה",
    "תאריך",
    true
  ],
  [
    "אימייל",
    "אימייל",
    true
  ],
  [
    "מספר טלפון",
    "טלפון",
    true
  ],
  [
    "משקל",
    "מספר",
    true
  ],
  [
    "גובה",
    "מספר",
    true
  ],
  [
    "בעיה רפואית או פציעה",
    "טקסט ארוך",
    true
  ],
  [
    "ניסיון באימונים",
    "טקסט ארוך",
    true
  ],
  [
    "מטרה לטווח הקצר",
    "בחירה",
    true
  ],
  [
    "התנהלות תזונתית",
    "בחירה",
    true
  ]
];

function renderQuestions() {
  const list =
    $("#questionList");

  if (!list) {
    return;
  }

  list.innerHTML =
    questionSamples
      .map(
        (question, index) => `
          <article class="question-item">
            <span>
              ${String(index + 1).padStart(2, "0")}
            </span>

            <div>
              <strong>
                ${escapeHtml(question[0])}
              </strong>

              <small>
                ${escapeHtml(question[1])}
                ${
                  question[2]
                    ? " · חובה"
                    : ""
                }
              </small>
            </div>

            <button
              class="table-button"
              type="button"
            >
              עריכה
            </button>
          </article>
        `
      )
      .join("");
}

$("#uploadButton")?.addEventListener(
  "click",
  () =>
    $("#mediaInput")?.click()
);

$("#mediaInput")?.addEventListener(
  "change",
  (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      showToast(
        "יש לבחור קובץ תמונה"
      );

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      6 * 1024 * 1024
    ) {
      showToast(
        "גודל התמונה חייב להיות עד 6MB"
      );

      event.target.value =
        "";

      return;
    }

    showToast(
      `נבחרה התמונה ${file.name}. חיבור אמיתי ל־R2 יבוצע בשלב הבא.`
    );
  }
);

/* =========================================================
   RENDER ORCHESTRATION
   ========================================================= */

function renderAllBusinessData() {
  renderStats();
  renderRecentApplications();
  renderApplicationsTable();
  renderKanban();
  renderDashboardAgenda();
  renderDashboardTasks();
  renderTaskManager();
  renderCalendar();
  renderActivity();
  renderNotifications();
  renderCharts();
}

function initializeDefaultsInForms() {
  const clientTaskDate =
    $("#clientTaskDate");

  const taskDate =
    $("#taskDate");

  const eventDate =
    $("#eventDate");

  if (clientTaskDate) {
    clientTaskDate.value =
      dateOffset(0);
  }

  if (taskDate) {
    taskDate.value =
      dateOffset(0);
  }

  if (eventDate) {
    eventDate.value =
      dateOffset(0);
  }
}

function initialize() {
  populateSettings();
  renderGreeting();
  renderQuestions();
  initializeDefaultsInForms();
  renderAllBusinessData();

  saveAll({
    silent: true
  });

  window.setInterval(
    updateAutosaveRelativeText,
    1000
  );
}

/* =========================================================
   GLOBAL ESCAPE HANDLER
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key !== "Escape"
    ) {
      return;
    }

    closeMobileSidebar();
    closeNotifications();
    closeDrawer();
    closeTaskModal();
    closeEventModal();
  }
);

initialize();