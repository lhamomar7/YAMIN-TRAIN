"use strict";

/* =========================================================
   SETTINGS
   ========================================================= */

// מספר WhatsApp בפורמט בינלאומי, ללא + וללא מקפים.
const WHATSAPP_NUMBER = "972504882838";

const header = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const mobileLinks = document.querySelectorAll(".mobile-link");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

/* =========================================================
   DARK / LIGHT MODE
   ========================================================= */

const THEME_STORAGE_KEY = "tlap_theme";

const themeToggle = document.getElementById("themeToggle");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const themeToggleText = document.getElementById("themeToggleText");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  const isLight = theme === "light";

  document.body.classList.toggle("theme-light", isLight);
  document.documentElement.dataset.theme = isLight ? "light" : "dark";

  if (themeToggleIcon) {
    themeToggleIcon.textContent = isLight ? "🌙" : "☀";
  }

  if (themeToggleText) {
    themeToggleText.textContent = isLight ? "Dark" : "Light";
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "מעבר למצב כהה" : "מעבר למצב בהיר"
    );

    themeToggle.setAttribute(
      "title",
      isLight ? "מעבר למצב כהה" : "מעבר למצב בהיר"
    );

    themeToggle.setAttribute("aria-pressed", String(isLight));
  }

  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      "content",
      isLight ? "#f5f1e8" : "#0b0b0b"
    );
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

const savedTheme =
  localStorage.getItem(THEME_STORAGE_KEY) || "dark";

applyTheme(savedTheme);

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains("theme-light")
    ? "light"
    : "dark";

  const nextTheme = currentTheme === "light" ? "dark" : "light";

  applyTheme(nextTheme);
});

/* =========================================================
   HERO MOTION
   ========================================================= */

const hero = document.getElementById("hero");

if (hero && !prefersReducedMotion.matches) {
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = 0;

  const renderHeroMotion = () => {
    currentX += (pointerX - currentX) * 0.075;
    currentY += (pointerY - currentY) * 0.075;

    hero.style.setProperty(
      "--hero-x",
      `${currentX.toFixed(2)}px`
    );

    hero.style.setProperty(
      "--hero-y",
      `${currentY.toFixed(2)}px`
    );

    rafId = requestAnimationFrame(renderHeroMotion);
  };

  const updatePointer = (event) => {
    const rect = hero.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const normalizedX =
      (event.clientX - rect.left) / rect.width - 0.5;

    const normalizedY =
      (event.clientY - rect.top) / rect.height - 0.5;

    pointerX = normalizedX * 14;
    pointerY = normalizedY * 9;
  };

  const resetPointer = () => {
    pointerX = 0;
    pointerY = 0;
  };

  const updateHeroScroll = () => {
    const rect = hero.getBoundingClientRect();

    const progress = Math.min(
      Math.max(
        -rect.top / Math.max(rect.height, 1),
        0
      ),
      1
    );

    hero.style.setProperty(
      "--hero-scroll",
      `${progress * 34}px`
    );
  };

  hero.addEventListener(
    "pointermove",
    updatePointer,
    { passive: true }
  );

  hero.addEventListener(
    "pointerleave",
    resetPointer,
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    updateHeroScroll,
    { passive: true }
  );

  updateHeroScroll();

  rafId = requestAnimationFrame(
    renderHeroMotion
  );

  window.addEventListener(
    "pagehide",
    () => cancelAnimationFrame(rafId),
    { once: true }
  );
}

/* =========================================================
   CINEMATIC ABOUT SECTION
   ========================================================= */

const cinematicAbout =
  document.querySelector(".cinematic-about");

const cinematicStage =
  document.querySelector(".cinematic-stage");

if (
  cinematicAbout &&
  cinematicStage &&
  !prefersReducedMotion.matches
) {
  const storyBlocks = [
    ...cinematicAbout.querySelectorAll(".story-block")
  ];

  let mouseTargetX = 0;
  let mouseTargetY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let aboutRaf = 0;

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

  const easeSegment = (
    progress,
    start,
    end
  ) =>
    clamp(
      (progress - start) /
        Math.max(end - start, 0.001),
      0,
      1
    );

  const updateCinematicAbout = () => {
    const rect =
      cinematicAbout.getBoundingClientRect();

    const scrollable = Math.max(
      cinematicAbout.offsetHeight -
        window.innerHeight,
      1
    );

    const progress = clamp(
      -rect.top / scrollable,
      0,
      1
    );

    mouseX +=
      (mouseTargetX - mouseX) * 0.07;

    mouseY +=
      (mouseTargetY - mouseY) * 0.07;

    const imageY =
      progress * 72 + mouseY;

    const imageScale =
      1.08 + progress * 0.055;

    cinematicStage.style.setProperty(
      "--about-x",
      `${mouseX.toFixed(2)}px`
    );

    cinematicStage.style.setProperty(
      "--about-y",
      `${imageY.toFixed(2)}px`
    );

    cinematicStage.style.setProperty(
      "--about-scale",
      imageScale.toFixed(4)
    );

    cinematicStage.style.setProperty(
      "--about-progress",
      `${(progress * 100).toFixed(2)}%`
    );

    storyBlocks.forEach(
      (block, index) => {
        const starts = [
          0.06,
          0.31,
          0.57
        ];

        const ends = [
          0.31,
          0.57,
          0.84
        ];

        const start =
          starts[index] ??
          starts[starts.length - 1];

        const end =
          ends[index] ??
          ends[ends.length - 1];

        const local = easeSegment(
          progress,
          start,
          end
        );

        const fadeOut =
          index < storyBlocks.length - 1
            ? 1 -
              easeSegment(
                progress,
                end - 0.03,
                end + 0.12
              ) *
                0.72
            : 1;

        const opacity = Math.max(
          0.14,
          local * fadeOut
        );

        block.style.setProperty(
          "--story-opacity",
          opacity.toFixed(3)
        );

        block.style.setProperty(
          "--story-x",
          `${((1 - local) * 42).toFixed(2)}px`
        );

        block.style.setProperty(
          "--story-y",
          `${((1 - local) * 22).toFixed(2)}px`
        );
      }
    );

    const signature = easeSegment(
      progress,
      0.79,
      0.96
    );

    cinematicStage.style.setProperty(
      "--signature-opacity",
      signature.toFixed(3)
    );

    cinematicStage.style.setProperty(
      "--signature-y",
      `${((1 - signature) * 20).toFixed(2)}px`
    );

    aboutRaf = requestAnimationFrame(
      updateCinematicAbout
    );
  };

  cinematicStage.addEventListener(
    "pointermove",
    (event) => {
      const rect =
        cinematicStage.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return;
      }

      const horizontalPosition =
        (event.clientX - rect.left) /
        rect.width;

      const verticalPosition =
        (event.clientY - rect.top) /
        rect.height;

      mouseTargetX =
        (horizontalPosition - 0.5) * 18;

      mouseTargetY =
        (verticalPosition - 0.5) * 10;

      cinematicStage.style.setProperty(
        "--glow-x",
        `${horizontalPosition * 100}%`
      );

      cinematicStage.style.setProperty(
        "--glow-y",
        `${verticalPosition * 100}%`
      );
    },
    { passive: true }
  );

  cinematicStage.addEventListener(
    "pointerleave",
    () => {
      mouseTargetX = 0;
      mouseTargetY = 0;

      cinematicStage.style.removeProperty(
        "--glow-x"
      );

      cinematicStage.style.removeProperty(
        "--glow-y"
      );
    },
    { passive: true }
  );

  aboutRaf = requestAnimationFrame(
    updateCinematicAbout
  );

  window.addEventListener(
    "pagehide",
    () =>
      cancelAnimationFrame(aboutRaf),
    { once: true }
  );
}

/* =========================================================
   HEADER AND MOBILE MENU
   ========================================================= */

function updateHeader() {
  header?.classList.toggle(
    "scrolled",
    window.scrollY > 50
  );
}

function setMobileMenu(open) {
  if (!hamburger || !mobileMenu) {
    return;
  }

  hamburger.classList.toggle(
    "active",
    open
  );

  hamburger.setAttribute(
    "aria-expanded",
    String(open)
  );

  mobileMenu.classList.toggle(
    "open",
    open
  );

  mobileMenu.setAttribute(
    "aria-hidden",
    String(!open)
  );

  document.body.style.overflow =
    open ? "hidden" : "";
}

window.addEventListener(
  "scroll",
  updateHeader,
  { passive: true }
);

updateHeader();

hamburger?.addEventListener(
  "click",
  () => {
    const isOpen =
      mobileMenu?.classList.contains(
        "open"
      ) ?? false;

    setMobileMenu(!isOpen);
  }
);

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setMobileMenu(false);
  });
});

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      setMobileMenu(false);
    }
  }
);

/* =========================================================
   REVEAL ANIMATIONS
   ========================================================= */

const revealElements =
  document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -45px"
      }
    );

  revealElements.forEach(
    (element) => {
      revealObserver.observe(element);
    }
  );
} else {
  revealElements.forEach(
    (element) => {
      element.classList.add("visible");
    }
  );
}

/* =========================================================
   ACTIVE NAVIGATION LINK
   ========================================================= */

const sections =
  document.querySelectorAll(
    "main section[id]"
  );

const desktopLinks =
  document.querySelectorAll(
    ".desktop-nav a"
  );

if ("IntersectionObserver" in window) {
  const sectionObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          desktopLinks.forEach(
            (link) => {
              const target =
                link.getAttribute("href");

              link.classList.toggle(
                "active",
                target ===
                  `#${entry.target.id}`
              );
            }
          );
        });
      },
      {
        rootMargin:
          "-35% 0px -55%",
        threshold: 0
      }
    );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

/* =========================================================
   SMART FAQ
   ========================================================= */

const faqButtons =
  document.querySelectorAll(
    ".faq-question"
  );

const faqSearch =
  document.getElementById(
    "faqSearch"
  );

const faqItems = [
  ...document.querySelectorAll(
    ".faq-item"
  )
];

const faqEmpty =
  document.getElementById(
    "faqEmpty"
  );

function closeFaqItem(item) {
  item.classList.remove("open");

  item
    .querySelector(".faq-question")
    ?.setAttribute(
      "aria-expanded",
      "false"
    );
}

faqButtons.forEach((button) => {
  button.addEventListener(
    "click",
    () => {
      const item =
        button.closest(".faq-item");

      if (!item) {
        return;
      }

      const isOpen =
        item.classList.contains("open");

      document
        .querySelectorAll(
          ".faq-item.open"
        )
        .forEach((openItem) => {
          closeFaqItem(openItem);
        });

      if (!isOpen) {
        item.classList.add("open");

        button.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    }
  );
});

function filterFaqItems() {
  if (!faqSearch) {
    return;
  }

  const query = faqSearch.value
    .trim()
    .toLocaleLowerCase("he");

  let visibleCount = 0;

  faqItems.forEach((item) => {
    const searchableText =
      item.textContent
        .toLocaleLowerCase("he");

    const matches =
      !query ||
      searchableText.includes(query);

    item.classList.toggle(
      "hidden-by-search",
      !matches
    );

    item.hidden = !matches;

    if (!matches) {
      closeFaqItem(item);
    } else {
      visibleCount += 1;
    }
  });

  if (faqEmpty) {
    faqEmpty.hidden =
      visibleCount !== 0;
  }
}

faqSearch?.addEventListener(
  "input",
  filterFaqItems
);

faqSearch?.addEventListener(
  "search",
  filterFaqItems
);

filterFaqItems();

/* =========================================================
   FITNESS CALCULATOR
   ========================================================= */

const fitnessCalculator =
  document.getElementById(
    "fitnessCalculator"
  );

const calcResults =
  document.getElementById(
    "calcResults"
  );

const bmiResult =
  document.getElementById(
    "bmiResult"
  );

const bmiStatus =
  document.getElementById(
    "bmiStatus"
  );

const maintenanceResult =
  document.getElementById(
    "maintenanceResult"
  );

const goalCaloriesResult =
  document.getElementById(
    "goalCaloriesResult"
  );

const goalCaloriesNote =
  document.getElementById(
    "goalCaloriesNote"
  );

const proteinResult =
  document.getElementById(
    "proteinResult"
  );

function getBmiStatus(bmi) {
  if (bmi < 18.5) {
    return "תת־משקל";
  }

  if (bmi < 25) {
    return "טווח תקין";
  }

  if (bmi < 30) {
    return "עודף משקל";
  }

  return "השמנה";
}

fitnessCalculator?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const genderInput =
      document.getElementById(
        "calcGender"
      );

    const ageInput =
      document.getElementById(
        "calcAge"
      );

    const weightInput =
      document.getElementById(
        "calcWeight"
      );

    const heightInput =
      document.getElementById(
        "calcHeight"
      );

    const activityInput =
      document.getElementById(
        "calcActivity"
      );

    const goalInput =
      document.getElementById(
        "calcGoal"
      );

    if (
      !genderInput ||
      !ageInput ||
      !weightInput ||
      !heightInput ||
      !activityInput ||
      !goalInput
    ) {
      console.error(
        "חסרים שדות במחשבון."
      );

      return;
    }

    if (
      !fitnessCalculator.checkValidity()
    ) {
      fitnessCalculator.reportValidity();
      return;
    }

    const gender =
      genderInput.value;

    const age =
      Number(ageInput.value);

    const weight =
      Number(weightInput.value);

    const height =
      Number(heightInput.value);

    const activity =
      Number(activityInput.value);

    const goal =
      goalInput.value;

    const valuesAreValid =
      (
        gender === "male" ||
        gender === "female"
      ) &&
      Number.isFinite(age) &&
      Number.isFinite(weight) &&
      Number.isFinite(height) &&
      Number.isFinite(activity) &&
      age >= 14 &&
      age <= 90 &&
      weight >= 30 &&
      weight <= 250 &&
      height >= 120 &&
      height <= 230 &&
      activity > 0 &&
      [
        "cut",
        "maintain",
        "gain"
      ].includes(goal);

    if (!valuesAreValid) {
      fitnessCalculator.reportValidity();
      return;
    }

    const heightInMeters =
      height / 100;

    const bmi =
      weight /
      heightInMeters ** 2;

    const bmr =
      gender === "male"
        ? 10 * weight +
          6.25 * height -
          5 * age +
          5
        : 10 * weight +
          6.25 * height -
          5 * age -
          161;

    const maintenance =
      Math.round(
        bmr * activity
      );

    let goalCalories =
      maintenance;

    let goalNote =
      "שמירה על משקל";

    if (goal === "cut") {
      goalCalories =
        Math.round(
          maintenance * 0.85
        );

      goalNote =
        "הפחתה משוערת של כ־15%";
    } else if (goal === "gain") {
      goalCalories =
        Math.round(
          maintenance * 1.1
        );

      goalNote =
        "תוספת משוערת של כ־10%";
    }

    let proteinMin =
      1.6 * weight;

    let proteinMax =
      2.2 * weight;

    if (goal === "cut") {
      proteinMin =
        1.8 * weight;

      proteinMax =
        2.4 * weight;
    }

    if (
      !bmiResult ||
      !bmiStatus ||
      !maintenanceResult ||
      !goalCaloriesResult ||
      !goalCaloriesNote ||
      !proteinResult ||
      !calcResults
    ) {
      console.error(
        "חסרים אזורי תוצאה במחשבון."
      );

      return;
    }

    bmiResult.textContent =
      bmi.toFixed(1);

    bmiStatus.textContent =
      getBmiStatus(bmi);

    maintenanceResult.textContent =
      maintenance.toLocaleString(
        "he-IL"
      );

    goalCaloriesResult.textContent =
      goalCalories.toLocaleString(
        "he-IL"
      );

    goalCaloriesNote.textContent =
      goalNote;

    proteinResult.textContent =
      `${Math.round(
        proteinMin
      )}–${Math.round(
        proteinMax
      )}`;

    calcResults.hidden = false;

    calcResults.scrollIntoView({
      behavior:
        prefersReducedMotion.matches
          ? "auto"
          : "smooth",
      block: "nearest"
    });
  }
);

/* =========================================================
   WHATSAPP FLOATING CHAT
   ========================================================= */

const whatsappToggle =
  document.getElementById(
    "whatsappToggle"
  );

const whatsappCard =
  document.getElementById(
    "whatsappCard"
  );

const whatsappClose =
  document.getElementById(
    "whatsappClose"
  );

const whatsappDirectLink =
  document.getElementById(
    "whatsappDirectLink"
  );

function setWhatsappWidget(open) {
  if (
    !whatsappCard ||
    !whatsappToggle
  ) {
    return;
  }

  whatsappCard.classList.toggle(
    "open",
    open
  );

  whatsappCard.setAttribute(
    "aria-hidden",
    String(!open)
  );

  whatsappToggle.setAttribute(
    "aria-expanded",
    String(open)
  );
}

if (whatsappDirectLink) {
  const whatsappMessage = [
    "היי יאמן, הגעתי דרך האתר.",
    "אני רוצה לשאול שאלה לגבי הליווי."
  ].join("\n");

  whatsappDirectLink.href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      whatsappMessage
    )}`;
}

whatsappToggle?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    const isOpen =
      whatsappCard?.classList.contains(
        "open"
      ) ?? false;

    setWhatsappWidget(!isOpen);
  }
);

whatsappClose?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
    setWhatsappWidget(false);
  }
);

whatsappCard?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
  }
);

document.addEventListener(
  "click",
  () => {
    setWhatsappWidget(false);
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      setWhatsappWidget(false);
    }
  }
);

window.setTimeout(() => {
  const wasOpened =
    sessionStorage.getItem(
      "tlap_whatsapp_opened"
    );

  if (!wasOpened) {
    setWhatsappWidget(true);

    sessionStorage.setItem(
      "tlap_whatsapp_opened",
      "true"
    );
  }
}, 7000);

/* =========================================================
   BEFORE / AFTER SLIDER
   ========================================================= */

const beforeAfterRange =
  document.getElementById(
    "beforeAfterRange"
  );

const beforeWrap =
  document.getElementById(
    "beforeWrap"
  );

const baDivider =
  document.getElementById(
    "baDivider"
  );

function updateBeforeAfter(value) {
  if (
    !beforeWrap ||
    !baDivider
  ) {
    return;
  }

  const numericValue =
    Number(value);

  const safeValue = Math.min(
    Math.max(
      Number.isFinite(numericValue)
        ? numericValue
        : 50,
      0
    ),
    100
  );

  beforeWrap.style.width =
    `${safeValue}%`;

  baDivider.style.left =
    `${safeValue}%`;
}

if (beforeAfterRange) {
  updateBeforeAfter(
    beforeAfterRange.value
  );

  beforeAfterRange.addEventListener(
    "input",
    () => {
      updateBeforeAfter(
        beforeAfterRange.value
      );
    }
  );
}

/* =========================================================
   CURRENT YEAR
   ========================================================= */

const currentYear =
  document.getElementById(
    "currentYear"
  );

if (currentYear) {
  currentYear.textContent =
    new Date().getFullYear();
}

/* =========================================================
   APPLICATION QUESTIONNAIRE
   ========================================================= */

const applicationModal =
  document.getElementById(
    "applicationModal"
  );

const questionnaire =
  document.getElementById(
    "nativeQuestionnaire"
  );

const formSteps = [
  ...document.querySelectorAll(
    ".form-step"
  )
];

const openApplicationButtons =
  document.querySelectorAll(
    ".open-application-modal"
  );

const closeApplicationButtons =
  document.querySelectorAll(
    "[data-close-application]"
  );

const previousStepButton =
  document.getElementById(
    "previousStepButton"
  );

const nextStepButton =
  document.getElementById(
    "nextStepButton"
  );

const submitQuestionnaireButton =
  document.getElementById(
    "submitQuestionnaireButton"
  );

const applicationProgressBar =
  document.getElementById(
    "applicationProgressBar"
  );

const applicationStepLabel =
  document.getElementById(
    "applicationStepLabel"
  );

const applicationStepName =
  document.getElementById(
    "applicationStepName"
  );

const submissionStatus =
  document.getElementById(
    "submissionStatus"
  );

const eatingDifficultyDetailsWrap =
  document.getElementById(
    "eatingDifficultyDetailsWrap"
  );

let currentApplicationStep = 0;
let applicationLastFocus = null;

function openApplicationModal() {
  if (
    !applicationModal ||
    !questionnaire ||
    formSteps.length === 0
  ) {
    return;
  }

  applicationLastFocus =
    document.activeElement;

  applicationModal.classList.add(
    "open"
  );

  applicationModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "application-open"
  );

  setMobileMenu(false);
  setWhatsappWidget(false);
  updateApplicationStep();

  requestAnimationFrame(() => {
    applicationModal
      .querySelector(
        ".application-close"
      )
      ?.focus();
  });
}

function closeApplicationModal() {
  if (!applicationModal) {
    return;
  }

  applicationModal.classList.remove(
    "open"
  );

  applicationModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "application-open"
  );

  applicationLastFocus?.focus?.();
}

function updateApplicationStep() {
  if (
    formSteps.length === 0 ||
    !previousStepButton ||
    !nextStepButton ||
    !submitQuestionnaireButton ||
    !applicationProgressBar ||
    !applicationStepLabel ||
    !applicationStepName
  ) {
    return;
  }

  currentApplicationStep = Math.min(
    Math.max(
      currentApplicationStep,
      0
    ),
    formSteps.length - 1
  );

  formSteps.forEach(
    (step, index) => {
      const isActive =
        index ===
        currentApplicationStep;

      step.classList.toggle(
        "active",
        isActive
      );

      step.setAttribute(
        "aria-hidden",
        String(!isActive)
      );
    }
  );

  previousStepButton.disabled =
    currentApplicationStep === 0;

  nextStepButton.hidden =
    currentApplicationStep ===
    formSteps.length - 1;

  submitQuestionnaireButton.hidden =
    currentApplicationStep !==
    formSteps.length - 1;

  const percent =
    (
      (currentApplicationStep + 1) /
      formSteps.length
    ) * 100;

  applicationProgressBar.style.width =
    `${percent}%`;

  applicationStepLabel.textContent =
    `שלב ${
      currentApplicationStep + 1
    } מתוך ${formSteps.length}`;

  applicationStepName.textContent =
    formSteps[
      currentApplicationStep
    ].dataset.name || "";

  applicationModal
    ?.querySelector(
      ".questionnaire-body"
    )
    ?.scrollTo({
      top: 0,
      behavior:
        prefersReducedMotion.matches
          ? "auto"
          : "smooth"
    });
}

function setControlError(
  control,
  message
) {
  const field =
    control.closest(".field");

  field?.classList.toggle(
    "invalid",
    Boolean(message)
  );

  control.setAttribute(
    "aria-invalid",
    String(Boolean(message))
  );

  const error =
    field?.querySelector(
      ".field-error"
    );

  if (error) {
    error.textContent = message;
  }
}

function validateCurrentStep() {
  const step =
    formSteps[
      currentApplicationStep
    ];

  if (!step) {
    return false;
  }

  let valid = true;

  step
    .querySelectorAll(
      "input[required], select[required], textarea[required]"
    )
    .forEach((control) => {
      if (
        control.type === "checkbox"
      ) {
        return;
      }

      let message = "";

      const value =
        control.value.trim();

      if (!value) {
        message =
          "זהו שדה חובה.";
      } else if (
        control.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          value
        )
      ) {
        message =
          "נא להזין כתובת אימייל תקינה.";
      } else if (
        control.name === "phone" &&
        !/^0\d{8,9}$/.test(
          value.replace(/\D/g, "")
        )
      ) {
        message =
          "נא להזין מספר טלפון ישראלי תקין.";
      }

      setControlError(
        control,
        message
      );

      if (message) {
        valid = false;
      }
    });

  step
    .querySelectorAll(
      "[data-required-group]"
    )
    .forEach((group) => {
      const name =
        group.dataset.requiredGroup;

      const checked =
        group.querySelector(
          `input[name="${name}"]:checked`
        );

      group.classList.toggle(
        "invalid",
        !checked
      );

      const groupError =
        group.querySelector(
          ".field-error"
        );

      if (groupError) {
        groupError.textContent =
          checked
            ? ""
            : "נא לבחור אפשרות.";
      }

      if (!checked) {
        valid = false;
      }
    });

  const consent =
    step.querySelector(
      'input[name="privacyConsent"]'
    );

  if (consent) {
    const error =
      step.querySelector(
        ".consent-error"
      );

    const okay =
      consent.checked;

    if (error) {
      error.textContent =
        okay
          ? ""
          : "נדרש אישור לשמירת הפרטים וליצירת קשר.";
    }

    if (!okay) {
      valid = false;
    }
  }

  if (!valid) {
    step
      .querySelector(
        ".invalid, .field-error:not(:empty)"
      )
      ?.scrollIntoView({
        behavior:
          prefersReducedMotion.matches
            ? "auto"
            : "smooth",
        block: "center"
      });
  }

  return valid;
}

function questionnaireToObject(form) {
  const data = new FormData(form);

  return Object.fromEntries(
    data.entries()
  );
}

openApplicationButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      openApplicationModal
    );
  }
);

closeApplicationButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      closeApplicationModal
    );
  }
);

previousStepButton?.addEventListener(
  "click",
  () => {
    if (
      currentApplicationStep > 0
    ) {
      currentApplicationStep -= 1;
      updateApplicationStep();
    }
  }
);

nextStepButton?.addEventListener(
  "click",
  () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (
      currentApplicationStep <
      formSteps.length - 1
    ) {
      currentApplicationStep += 1;
      updateApplicationStep();
    }
  }
);

document
  .querySelectorAll(
    'input[name="eatingDifficulty"]'
  )
  .forEach((radio) => {
    radio.addEventListener(
      "change",
      () => {
        if (
          eatingDifficultyDetailsWrap
        ) {
          eatingDifficultyDetailsWrap.hidden =
            radio.value !== "כן";
        }
      }
    );
  });

questionnaire?.addEventListener(
  "input",
  (event) => {
    const control =
      event.target;

    if (
      control instanceof HTMLElement &&
      control.matches(
        "input, select, textarea"
      )
    ) {
      setControlError(
        control,
        ""
      );
    }
  }
);

questionnaire?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    if (
      !submissionStatus ||
      !submitQuestionnaireButton
    ) {
      return;
    }

    submissionStatus.className =
      "submission-status";

    submissionStatus.textContent =
      "שולח את השאלון...";

    submitQuestionnaireButton.disabled =
      true;

    const payload =
      questionnaireToObject(
        questionnaire
      );

    try {
      const response = await fetch(
        "/api/applications",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(payload)
        }
      );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            "לא ניתן היה לשמור את השאלון."
        );
      }

      submissionStatus.classList.add(
        "success"
      );

      submissionStatus.textContent =
        "השאלון נשלח בהצלחה. יאמן יוכל לצפות בו במערכת.";

      questionnaire.reset();

      if (
        eatingDifficultyDetailsWrap
      ) {
        eatingDifficultyDetailsWrap.hidden =
          true;
      }

      currentApplicationStep = 0;

      window.setTimeout(() => {
        updateApplicationStep();
        closeApplicationModal();
      }, 1800);
    } catch (error) {
      submissionStatus.classList.add(
        "error"
      );

      submissionStatus.textContent =
        error instanceof Error &&
        error.message
          ? error.message
          : "השליחה נכשלה. יש להפעיל את האתר דרך השרת המצורף ולא באמצעות Live Server בלבד.";

      console.error(error);
    } finally {
      submitQuestionnaireButton.disabled =
        false;
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      applicationModal?.classList.contains(
        "open"
      )
    ) {
      closeApplicationModal();
    }
  }
);

/* =========================================================
   TERMS MODAL
   ========================================================= */

const termsLink =
  document.getElementById(
    "termsLink"
  );

const termsModal =
  document.getElementById(
    "termsModal"
  );

const termsClose =
  document.getElementById(
    "termsClose"
  );

const termsBackdrop =
  document.getElementById(
    "termsBackdrop"
  );

const termsConfirm =
  document.getElementById(
    "termsConfirm"
  );

function openTermsModal() {
  if (!termsModal) {
    return;
  }

  termsModal.classList.add("open");

  termsModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

  setWhatsappWidget(false);

  termsClose?.focus();
}

function closeTermsModal() {
  if (!termsModal) {
    return;
  }

  termsModal.classList.remove(
    "open"
  );

  termsModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

  termsLink?.focus();
}

termsLink?.addEventListener(
  "click",
  (event) => {
    event.preventDefault();
    openTermsModal();
  }
);

termsClose?.addEventListener(
  "click",
  closeTermsModal
);

termsBackdrop?.addEventListener(
  "click",
  closeTermsModal
);

termsConfirm?.addEventListener(
  "click",
  closeTermsModal
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      termsModal?.classList.contains(
        "open"
      )
    ) {
      closeTermsModal();
    }
  }
);