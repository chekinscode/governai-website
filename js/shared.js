/* ============================================================
   GovernAI — shared.js
   Nav toggle, scroll-reveal, theme toggle, counters, tabs/toggles.
   No dependencies. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var burger = document.querySelector(".nav-hamburger");
    var links = document.querySelector(".nav-links");
    if (!burger || !links) return;
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
  }

  /* ---------- Theme toggle (dark is always the default) ----------
     Uses sessionStorage, not localStorage: a toggle to light mode
     persists across pages for the rest of the current browser
     session (so in-page navigation doesn't flicker back to dark),
     but every new visit/session starts dark again — dark is the
     durable default, not just the first-run default. ---------- */
  function initTheme() {
    var btn = document.querySelector(".theme-toggle");
    var root = document.documentElement;
    root.removeAttribute("data-theme");
    try { localStorage.removeItem("governai-theme"); } catch (e) {} /* retire old persisted key */
    var stored = null;
    try { stored = sessionStorage.getItem("governai-theme"); } catch (e) {}
    if (stored === "light") root.setAttribute("data-theme", "light");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      var next = current === "light" ? "dark" : "light";
      if (next === "dark") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "light");
      try { sessionStorage.setItem("governai-theme", next); } catch (e) {}
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var targets = document.querySelectorAll(".reveal, .reveal-stagger");
    if (!targets.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Animated counters (data-count-to="42" data-suffix="%") ---------- */
  function animateCounter(el) {
    var to = parseFloat(el.getAttribute("data-count-to"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reducedMotion) { el.textContent = prefix + to.toFixed(decimals) + suffix; return; }
    var duration = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = to * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function initCounters() {
    var counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;
    if (!("IntersectionObserver" in window)) { counters.forEach(animateCounter); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ---------- Generic tab groups: [data-tabs] > [data-tab] buttons + [data-tab-panel] ---------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (group) {
      var buttons = group.querySelectorAll("[data-tab]");
      var scope = group.closest("[data-tab-scope]") || document;
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-tab");
          buttons.forEach(function (b) { b.classList.toggle("active", b === btn); });
          scope.querySelectorAll("[data-tab-panel]").forEach(function (panel) {
            panel.classList.toggle("hidden", panel.getAttribute("data-tab-panel") !== key);
          });
        });
      });
    });
  }

  /* ---------- Generic toggle switches: [data-toggle] ---------- */
  function initToggles() {
    document.querySelectorAll("[data-toggle]").forEach(function (sw) {
      sw.addEventListener("click", function () {
        sw.classList.toggle("on");
        var evt = new CustomEvent("toggle:change", { detail: { on: sw.classList.contains("on") } });
        sw.dispatchEvent(evt);
      });
    });
  }

  /* ---------- Typing effect utility (used by hero + widgets) ---------- */
  window.GovernAI = window.GovernAI || {};
  window.GovernAI.reducedMotion = reducedMotion;
  window.GovernAI.typeText = function (el, text, opts) {
    opts = opts || {};
    var speed = reducedMotion ? 0 : (opts.speed || 14);
    var i = 0;
    if (reducedMotion) { el.textContent = text; if (opts.onDone) opts.onDone(); return; }
    el.textContent = "";
    (function step() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed + Math.random() * 10);
      } else if (opts.onDone) { opts.onDone(); }
    })();
  };

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initTheme();
    initReveal();
    initCounters();
    initTabs();
    initToggles();
  });
})();
