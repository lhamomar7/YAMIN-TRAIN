"use strict";

/* =========================================================
   TRAIN LIKE A PRO
   SIDEBAR NAVIGATION FIX
   ========================================================= */

(function initializeAdminNavigation() {
  function startNavigation() {
    /*
     * מניעת הפעלה כפולה של הקוד.
     */
    if (
      document.documentElement.dataset
        .adminNavigationReady === "true"
    ) {
      return;
    }

    document.documentElement.dataset
      .adminNavigationReady = "true";

    const sidebar =
      document.getElementById("sidebar");

    const menuButton =
      document.getElementById(
        "menuButton"
      );

    const pageTitle =
      document.getElementById(
        "pageTitle"
      );

    const mobileBackdrop =
      document.getElementById(
        "mobileSidebarBackdrop"
      );

    const notificationPanel =
      document.getElementById(
        "notificationPanel"
      );

    const notificationButton =
      document.getElementById(
        "notificationButton"
      );

    const navItems = [
      ...document.querySelectorAll(
        ".nav-item[data-view]"
      )
    ];

    const views = [
      ...document.querySelectorAll(
        ".view[data-view-panel]"
      )
    ];

    const pageTitles = {
      overview: "לוח בקרה",
      pipeline: "Pipeline",
      applications:
        "פניות ושאלונים",
      calendar: "יומן ופגישות",
      tasks: "משימות",
      content: "תוכן האתר",
      design: "עיצוב וצבעים",
      media: "תמונות ומדיה",
      questionnaire:
        "ניהול השאלון",
      seo: "SEO ושיתוף",
      settings: "הגדרות מערכת"
    };

    /* =====================================================
       SIDEBAR
       ===================================================== */

    function openSidebar() {
      if (!sidebar) {
        return;
      }

      sidebar.classList.add("open");

      document.body.classList.add(
        "mobile-menu-open"
      );

      menuButton?.setAttribute(
        "aria-expanded",
        "true"
      );

      mobileBackdrop?.classList.add(
        "open"
      );

      mobileBackdrop?.setAttribute(
        "aria-hidden",
        "false"
      );
    }

    function closeSidebar() {
      sidebar?.classList.remove(
        "open"
      );

      document.body.classList.remove(
        "mobile-menu-open"
      );

      menuButton?.setAttribute(
        "aria-expanded",
        "false"
      );

      mobileBackdrop?.classList.remove(
        "open"
      );

      mobileBackdrop?.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    function toggleSidebar() {
      const isOpen =
        sidebar?.classList.contains(
          "open"
        );

      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }

    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    function closeNotifications() {
      notificationPanel?.classList.remove(
        "open"
      );

      notificationPanel?.setAttribute(
        "aria-hidden",
        "true"
      );

      notificationButton?.setAttribute(
        "aria-expanded",
        "false"
      );
    }

    /* =====================================================
       VIEW NAVIGATION
       ===================================================== */

    function findView(viewName) {
      return views.find(
        (view) =>
          view.dataset.viewPanel ===
          viewName
      );
    }

    function switchView(
      viewName,
      options = {}
    ) {
      const {
        updateHash = true,
        scrollToTop = true
      } = options;

      if (!viewName) {
        return;
      }

      const targetView =
        findView(viewName);

      if (!targetView) {
        console.error(
          `לא נמצא עמוד עם data-view-panel="${viewName}"`
        );

        return;
      }

      /*
       * סימון כפתור פעיל.
       */
      navItems.forEach((item) => {
        const isActive =
          item.dataset.view ===
          viewName;

        item.classList.toggle(
          "active",
          isActive
        );

        item.setAttribute(
          "aria-current",
          isActive ? "page" : "false"
        );
      });

      /*
       * הצגת העמוד הנבחר והסתרת היתר.
       */
      views.forEach((view) => {
        const isActive =
          view.dataset.viewPanel ===
          viewName;

        view.classList.toggle(
          "active",
          isActive
        );

        view.hidden = !isActive;

        view.setAttribute(
          "aria-hidden",
          String(!isActive)
        );

        /*
         * ביטול display שהוגדר בטעות
         * ישירות על האלמנט.
         */
        if (isActive) {
          view.style.removeProperty(
            "display"
          );
        }
      });

      /*
       * שינוי כותרת עליונה.
       */
      if (pageTitle) {
        pageTitle.textContent =
          pageTitles[viewName] ||
          "מערכת ניהול";
      }

      document.body.dataset.currentView =
        viewName;

      /*
       * שמירת העמוד האחרון.
       */
      try {
        sessionStorage.setItem(
          "tlap_admin_current_view",
          viewName
        );
      } catch (error) {
        console.warn(
          "לא ניתן לשמור את העמוד האחרון:",
          error
        );
      }

      /*
       * הוספת Hash לכתובת.
       */
      if (updateHash) {
        const nextHash =
          `#${encodeURIComponent(
            viewName
          )}`;

        if (
          window.location.hash !==
          nextHash
        ) {
          history.replaceState(
            null,
            "",
            nextHash
          );
        }
      }

      closeSidebar();
      closeNotifications();

      if (scrollToTop) {
        window.scrollTo({
          top: 0,
          behavior:
            window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches
              ? "auto"
              : "smooth"
        });
      }

      /*
       * אירוע שניתן לקלוט בחלקים
       * אחרים של המערכת.
       */
      document.dispatchEvent(
        new CustomEvent(
          "adminViewChanged",
          {
            detail: {
              viewName
            }
          }
        )
      );
    }

    /* =====================================================
       MENU BUTTON
       ===================================================== */

    if (menuButton) {
      menuButton.setAttribute(
        "aria-controls",
        "sidebar"
      );

      menuButton.setAttribute(
        "aria-expanded",
        "false"
      );

      menuButton.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();

          toggleSidebar();
        }
      );
    }

    mobileBackdrop?.addEventListener(
      "click",
      closeSidebar
    );

    /* =====================================================
       NAVIGATION CLICK
       ===================================================== */

    navItems.forEach((item) => {
      /*
       * מניעת Submit במקרה שהכפתור
       * נמצא בטעות בתוך Form.
       */
      if (
        item.tagName === "BUTTON" &&
        !item.hasAttribute("type")
      ) {
        item.type = "button";
      }

      item.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();

          const viewName =
            item.dataset.view;

          switchView(viewName);
        }
      );
    });

    /* =====================================================
       SHORTCUT BUTTONS
       ===================================================== */

    document
      .querySelectorAll("[data-jump]")
      .forEach((button) => {
        if (
          button.tagName ===
            "BUTTON" &&
          !button.hasAttribute("type")
        ) {
          button.type = "button";
        }

        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            switchView(
              button.dataset.jump
            );
          }
        );
      });

    /* =====================================================
       NOTIFICATION LINKS
       ===================================================== */

    document.addEventListener(
      "click",
      (event) => {
        const notificationLink =
          event.target.closest(
            "[data-notification-view]"
          );

        if (!notificationLink) {
          return;
        }

        event.preventDefault();

        switchView(
          notificationLink.dataset
            .notificationView
        );
      }
    );

    /* =====================================================
       CLICK OUTSIDE SIDEBAR
       ===================================================== */

    document.addEventListener(
      "click",
      (event) => {
        if (
          window.innerWidth > 860 ||
          !sidebar?.classList.contains(
            "open"
          )
        ) {
          return;
        }

        const clickedInsideSidebar =
          sidebar.contains(
            event.target
          );

        const clickedMenuButton =
          menuButton?.contains(
            event.target
          );

        if (
          !clickedInsideSidebar &&
          !clickedMenuButton
        ) {
          closeSidebar();
        }
      }
    );

    /* =====================================================
       KEYBOARD
       ===================================================== */

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          closeSidebar();
          closeNotifications();
        }
      }
    );

    /* =====================================================
       RESPONSIVE
       ===================================================== */

    window.addEventListener(
      "resize",
      () => {
        if (
          window.innerWidth > 860
        ) {
          closeSidebar();
        }
      }
    );

    /* =====================================================
       HASH NAVIGATION
       ===================================================== */

    window.addEventListener(
      "hashchange",
      () => {
        const viewFromHash =
          decodeURIComponent(
            window.location.hash.replace(
              "#",
              ""
            )
          );

        if (findView(viewFromHash)) {
          switchView(viewFromHash, {
            updateHash: false
          });
        }
      }
    );

    /* =====================================================
       INITIAL VIEW
       ===================================================== */

    const hashView =
      decodeURIComponent(
        window.location.hash.replace(
          "#",
          ""
        )
      );

    const savedView =
      sessionStorage.getItem(
        "tlap_admin_current_view"
      );

    const activeView =
      document.querySelector(
        ".nav-item.active[data-view]"
      )?.dataset.view;

    const initialView =
      findView(hashView)
        ? hashView
        : findView(savedView)
          ? savedView
          : findView(activeView)
            ? activeView
            : findView("overview")
              ? "overview"
              : views[0]?.dataset
                  .viewPanel;

    if (initialView) {
      switchView(initialView, {
        updateHash:
          Boolean(
            window.location.hash
          ),
        scrollToTop: false
      });
    }

    console.log(
      `Admin navigation ready: ${navItems.length} buttons, ${views.length} views.`
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startNavigation,
      {
        once: true
      }
    );
  } else {
    startNavigation();
  }
})();
