/* ==================================================================
 * Counsel — main.js
 * Vanilla JavaScript only. One function per feature, guard clauses.
 * ================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------
   * Mobile navigation (Bootstrap collapse handles the toggle; we add
   * active-state + auto-close on link click for the animated bars).
   * ---------------------------------------------------------------- */
  function initNav() {
    var toggler = document.querySelector(".navbar-toggler");
    var collapse = document.getElementById("primary-nav");
    if (!toggler || !collapse) return;

    // Close the menu when a nav link is tapped on mobile.
    collapse.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (collapse.classList.contains("show")) {
          var inst = window.bootstrap &&
            window.bootstrap.Collapse.getInstance(collapse);
          if (inst) inst.hide();
        }
      });
    });

    // Reflect state on the toggler for the animated bars.
    collapse.addEventListener("show.bs.collapse", function () {
      toggler.setAttribute("aria-expanded", "true");
    });
    collapse.addEventListener("hide.bs.collapse", function () {
      toggler.setAttribute("aria-expanded", "false");
    });
  }

  /* ----------------------------------------------------------------
   * Sticky navbar shadow on scroll.
   * ---------------------------------------------------------------- */
  function initStickyNav() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------------
   * Active nav link highlight based on section in view (index only).
   * ---------------------------------------------------------------- */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".nav-menu .nav-link[data-spy]")
    );
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("data-spy");
      var sec = document.getElementById(id);
      if (sec) { map[id] = link; sections.push(sec); }
    });
    if (!sections.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var active = map[entry.target.id];
          if (active) active.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { obs.observe(s); });
  }

  /* ----------------------------------------------------------------
   * Reveal-on-scroll animations via IntersectionObserver.
   * ---------------------------------------------------------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          o.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    els.forEach(function (el) { obs.observe(el); });
  }

  /* ----------------------------------------------------------------
   * Count-up for stat numbers when they scroll into view.
   * Reads data-count (target) and optional data-prefix/data-suffix.
   * ---------------------------------------------------------------- */
  function initCountUp() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (isNaN(target)) return;

      if (prefersReduced) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }
      var start = null;
      var dur = 1600;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = prefix +
          val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix +
          target.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
          suffix;
      }
      requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          o.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  /* ----------------------------------------------------------------
   * Testimonials slider — accessible, keyboard + dots + autoplay.
   * ---------------------------------------------------------------- */
  function initSlider() {
    var slider = document.querySelector("[data-slider]");
    if (!slider) return;
    var track = slider.querySelector(".slider-track");
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
    var prevBtn = slider.querySelector("[data-slider-prev]");
    var nextBtn = slider.querySelector("[data-slider-next]");
    var dotsWrap = slider.querySelector(".slider-dots");
    if (!track || slides.length < 2) return;

    var index = 0;
    var timer = null;
    var AUTO = 6500;

    // Build dots
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        b.addEventListener("click", function () { go(i); restart(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function render() {
      track.style.transform = "translateX(-" + (index * 100) + "%)";
      slides.forEach(function (s, i) {
        s.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("active", i === index);
        d.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }
    function go(i) {
      index = (i + slides.length) % slides.length;
      render();
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function start() {
      if (prefersReduced) return;
      stop();
      timer = setInterval(next, AUTO);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    // Keyboard support
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { next(); restart(); }
      else if (e.key === "ArrowLeft") { prev(); restart(); }
    });

    // Pause on hover/focus
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);

    // Touch swipe
    var startX = 0, dx = 0, touching = false;
    slider.addEventListener("touchstart", function (e) {
      touching = true; startX = e.touches[0].clientX; dx = 0; stop();
    }, { passive: true });
    slider.addEventListener("touchmove", function (e) {
      if (touching) dx = e.touches[0].clientX - startX;
    }, { passive: true });
    slider.addEventListener("touchend", function () {
      if (Math.abs(dx) > 45) { dx < 0 ? next() : prev(); }
      touching = false; start();
    });

    render();
    start();
  }

  /* ----------------------------------------------------------------
   * Case-evaluation / consultation form validation (front-end only).
   * ---------------------------------------------------------------- */
  function initForms() {
    var forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;

    forms.forEach(function (form) {
      var success = form.querySelector(".form-success");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var valid = true;
        var firstBad = null;

        form.querySelectorAll("[data-required]").forEach(function (field) {
          var val = (field.value || "").trim();
          var errBox = field.parentNode.querySelector(".field-error");
          var ok = val.length > 0;

          if (ok && field.type === "email") {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          }
          if (ok && field.getAttribute("data-type") === "phone") {
            ok = (val.replace(/[^0-9]/g, "").length >= 7);
          }

          field.classList.toggle("is-invalid", !ok);
          field.setAttribute("aria-invalid", ok ? "false" : "true");
          if (errBox) errBox.classList.toggle("show", !ok);
          if (!ok) { valid = false; if (!firstBad) firstBad = field; }
        });

        if (!valid) {
          if (firstBad) firstBad.focus();
          if (success) success.classList.remove("show");
          return;
        }

        form.reset();
        if (success) {
          success.classList.add("show");
          success.setAttribute("tabindex", "-1");
          success.focus();
        }
      });

      // Clear invalid state as the user corrects a field.
      form.querySelectorAll("[data-required]").forEach(function (field) {
        field.addEventListener("input", function () {
          if (field.classList.contains("is-invalid") &&
              (field.value || "").trim().length > 0) {
            field.classList.remove("is-invalid");
            field.setAttribute("aria-invalid", "false");
            var errBox = field.parentNode.querySelector(".field-error");
            if (errBox) errBox.classList.remove("show");
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------------
   * Smooth-scroll for in-page anchor links with sticky-offset.
   * ---------------------------------------------------------------- */
  function initSmoothAnchors() {
    var links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    if (!links.length) return;
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({
          top: top,
          behavior: prefersReduced ? "auto" : "smooth"
        });
        // Move focus for keyboard users.
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ----------------------------------------------------------------
   * Current year in footer.
   * ---------------------------------------------------------------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------- */
  function boot() {
    initNav();
    initStickyNav();
    initScrollSpy();
    initReveal();
    initCountUp();
    initSlider();
    initForms();
    initSmoothAnchors();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
