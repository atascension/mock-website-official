/* ==========================================================================
   SAVE POINT — script.js
   1. Mobile navigation toggle
   2. Era tabs (WAI-ARIA tabs pattern, keyboard accessible)
   3. "Suggest a missing game" form (on-page thank-you, no backend yet)
   4. "Explore the Archive" click tracking hook
   5. Footer year
   6. Hero typewriter (rotating end of the headline)
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Mobile navigation toggle
     ------------------------------------------------------------------------ */
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.getElementById("primary-nav");

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    navMenu.classList.toggle("is-open", open);
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    // Close after choosing a link
    navMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    // Close with Escape and return focus to the toggle
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Era tabs
     Click or use Left/Right (or Up/Down), Home, and End to move between tabs.
     ------------------------------------------------------------------------ */
  document.querySelectorAll("[data-tabs]").forEach(function (tabsEl) {
    const tabs = Array.from(tabsEl.querySelectorAll('[role="tab"]'));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function selectTab(newTab, moveFocus) {
      tabs.forEach(function (tab) {
        const selected = tab === newTab;
        const panel = document.getElementById(tab.getAttribute("aria-controls"));

        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panel.hidden = !selected;

        if (selected && !reduceMotion.matches) {
          // Retrigger the short "pixel-in" animation
          panel.classList.remove("is-entering");
          void panel.offsetWidth;
          panel.classList.add("is-entering");
        }
      });
      if (moveFocus) newTab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });

      tab.addEventListener("keydown", function (event) {
        let next = null;
        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
            next = tabs[(index + 1) % tabs.length];
            break;
          case "ArrowLeft":
          case "ArrowUp":
            next = tabs[(index - 1 + tabs.length) % tabs.length];
            break;
          case "Home":
            next = tabs[0];
            break;
          case "End":
            next = tabs[tabs.length - 1];
            break;
        }
        if (next) {
          event.preventDefault();
          selectTab(next, true);
        }
      });
    });
  });

  /* ------------------------------------------------------------------------
     3. Suggest a missing game or console
     There is no backend yet, so we show a friendly thank-you on the page.
     ------------------------------------------------------------------------ */
  const form = document.getElementById("suggest-form");
  const thanks = document.getElementById("suggest-thanks");

  function showError(input, errorEl, show) {
    errorEl.hidden = !show;
    if (show) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  if (form && thanks) {
    const nameInput = form.querySelector("#suggest-name");
    const nameError = form.querySelector("#suggest-name-error");
    const emailInput = form.querySelector("#suggest-email");
    const emailError = form.querySelector("#suggest-email-error");

    // Clear errors as soon as the visitor fixes them
    nameInput.addEventListener("input", function () {
      if (nameInput.value.trim()) showError(nameInput, nameError, false);
    });
    emailInput.addEventListener("input", function () {
      if (emailInput.validity.valid) showError(emailInput, emailError, false);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const nameMissing = nameInput.value.trim() === "";
      const emailBad = emailInput.value.trim() !== "" && !emailInput.validity.valid;

      showError(nameInput, nameError, nameMissing);
      showError(emailInput, emailError, emailBad);

      if (nameMissing) {
        nameInput.focus();
        return;
      }
      if (emailBad) {
        emailInput.focus();
        return;
      }

      const suggestion = nameInput.value.trim();

      /* TODO: Connect a real form service here.
         Example with Formspree:
           fetch("https://formspree.io/f/YOUR_FORM_ID", {
             method: "POST",
             headers: { Accept: "application/json" },
             body: new FormData(form)
           });
         Then show the thank-you below once the request succeeds. */

      showThanks(suggestion);
    });

    function showThanks(suggestion) {
      form.hidden = true;
      thanks.innerHTML =
        '<h3 tabindex="-1">' +
        '<svg class="px-icon" aria-hidden="true"><use href="#px-heart"></use></svg>' +
        "Thanks, player one!</h3>" +
        "<p>We got your suggestion for <strong></strong>. " +
        "Our team will take a look, and if it fits, it'll find its spot in the archive.</p>" +
        '<button class="btn btn-sm" type="button">Suggest another</button>';

      // Insert the visitor's text safely (no HTML injection)
      thanks.querySelector("strong").textContent = suggestion;

      thanks.querySelector("h3").focus();

      thanks.querySelector("button").addEventListener("click", function () {
        form.reset();
        thanks.innerHTML = "";
        form.hidden = false;
        nameInput.focus();
      });
    }
  }

  /* ------------------------------------------------------------------------
     4. "Explore the Archive" buttons
     Every main CTA carries data-cta="explore-archive" so clicks can be tracked.
     ------------------------------------------------------------------------ */
  document.addEventListener("click", function (event) {
    const cta = event.target.closest('[data-cta="explore-archive"]');
    if (!cta) return;

    // TODO: send the click to your analytics tool here, for example:
    //   gtag("event", "explore_archive_click", { location: cta.className });

    // Until the real archive link is added, don't jump to the top of the page.
    if (cta.getAttribute("href") === "#") event.preventDefault();
  });

  /* ------------------------------------------------------------------------
     5. Footer year
     ------------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------------
     6. Hero typewriter
     Deletes the end of the headline and types the next phrase, on a loop.
     Screen readers always get the original sentence (see .sr-only in the h1).
     ------------------------------------------------------------------------ */
  const typeEl = document.querySelector("[data-typewriter]");
  const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeEl && motionOk) {
    // Edit these freely. The first one should match the text in index.html.
    const phrases = [
      "all in one place.",
      "one cartridge at a time.",
      "no blowing required.",
      "pixel by pixel.",
      "from 8-bit to 64-bit.",
      "right where you left off."
    ];

    const TYPE_SPEED = 85;    // ms per character typed
    const DELETE_SPEED = 45;  // ms per character deleted
    const HOLD_FULL = 2200;   // pause once a phrase is fully typed
    const HOLD_EMPTY = 400;   // pause after deleting, before typing again

    const title = typeEl.closest("h1");
    const cursor = title.querySelector(".cursor");
    let phraseIndex = 0;
    let charCount = phrases[0].length;
    let deleting = true;
    let timer = null;

    function setTyping(active) {
      if (cursor) cursor.classList.toggle("is-typing", active);
    }

    function tick() {
      const phrase = phrases[phraseIndex];
      let delay;

      if (deleting) {
        charCount--;
        typeEl.textContent = phrase.slice(0, charCount);
        setTyping(true);
        delay = DELETE_SPEED;

        if (charCount === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTyping(false);
          delay = HOLD_EMPTY;
        }
      } else {
        charCount++;
        typeEl.textContent = phrase.slice(0, charCount);
        setTyping(true);
        // A little jitter so it feels hand-typed
        delay = TYPE_SPEED + Math.random() * 60 - 30;

        if (charCount === phrase.length) {
          deleting = true;
          setTyping(false);
          delay = HOLD_FULL;
        }
      }

      timer = setTimeout(tick, delay);
    }

    // Reserve room for the tallest phrase so the content below never jumps
    function reserveHeight() {
      const current = typeEl.textContent;
      let tallest = 0;
      title.style.minHeight = "";
      phrases.forEach(function (phrase) {
        typeEl.textContent = phrase;
        tallest = Math.max(tallest, title.offsetHeight);
      });
      typeEl.textContent = current;
      title.style.minHeight = tallest + "px";
    }

    function start() {
      if (!timer) timer = setTimeout(tick, HOLD_FULL);
    }

    function stop() {
      clearTimeout(timer);
      timer = null;
      setTyping(false);
    }

    reserveHeight();
    if (document.fonts) document.fonts.ready.then(reserveHeight);

    let resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reserveHeight, 150);
    });

    // Don't keep typing in a background tab
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    start();
  }
})();
