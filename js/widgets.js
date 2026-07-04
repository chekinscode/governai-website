/* ============================================================
   GovernAI — widgets.js
   Product-simulation widgets referenced from the marketing pages.
   Pure vanilla JS, no dependencies. Each widget guards for the
   presence of its root element so this file is safe to include
   on every page.
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.GovernAI && window.GovernAI.reducedMotion;

  /* ==================================================================
     HERO — streaming chat + model switcher + simulated failover
     Markup: #hero-chat-widget with [data-model-pill], #hero-chat-log
     ================================================================== */
  function initHeroChat() {
    var root = document.getElementById("hero-chat-widget");
    if (!root) return;
    var log = root.querySelector("#hero-chat-log");
    var pills = root.querySelectorAll("[data-model-pill]");
    var statusEl = root.querySelector("#hero-model-status");

    var scripts = {
      "gpt-4o": {
        label: "GPT-4o",
        turns: [
          {
            q: "Summarize this quarter's vendor contract renewals over $50k.",
            a: "3 contracts qualify: Acme Cloud ($82k, renews Aug 14), Northwind Analytics ($61k, renews Sep 2), and Fenwick Legal Services ($54k, renews Sep 30). All three are within policy — no approval required for renewals under $100k."
          },
          {
            q: "Draft a Slack reminder to the eng team about the Acme Cloud renewal.",
            a: "Here's a draft for #eng-leads: \"Heads up — the Acme Cloud contract ($82k) renews Aug 14. No action needed unless we're changing tier; flag me by Aug 7 if so.\" Since this posts to Slack, it'll route through your Approval Queue before sending."
          }
        ]
      },
      "claude": {
        label: "Claude",
        turns: [
          {
            q: "Summarize this quarter's vendor contract renewals over $50k.",
            a: "Three renewals cross the $50k threshold this quarter. Acme Cloud leads at $82k (Aug 14), followed by Northwind Analytics at $61k (Sep 2) and Fenwick Legal at $54k (Sep 30). Source: Q3-vendor-ledger.xlsx, rows 12–47."
          },
          {
            q: "Which of those is closest to needing re-approval?",
            a: "Acme Cloud, renewing Aug 14 — 12 days out from today. The other two (Sep 2 and Sep 30) have more runway. None require approval to renew since all sit under the $100k policy threshold."
          }
        ]
      },
      "gemini": {
        label: "Gemini",
        turns: [
          {
            q: "Summarize this quarter's vendor contract renewals over $50k.",
            a: "Found 3 renewals above $50k: Acme Cloud $82,000 (Aug 14), Northwind Analytics $61,000 (Sep 2), Fenwick Legal $54,000 (Sep 30). Total exposure: $197,000."
          },
          {
            q: "Would any of these have needed a human approval if they'd renewed above $100k?",
            a: "Yes — any renewal over $100k triggers GovernAI's write-approval gate automatically. It would route to a named approver in the Approval Queue before the action executes, the same flow used for CRM updates and refunds."
          }
        ]
      }
    };

    var current = "gpt-4o";
    var typing = false;
    var extended = root.hasAttribute("data-extended-demo");

    function render(key, simulateFailover) {
      if (typing) return;
      typing = true;
      var s = scripts[key];
      var firstTurn = s.turns[0];
      var lastTurn = extended ? s.turns[1] : s.turns[0];

      log.innerHTML = extended
        ? '<div class="chat-line chat-line-user"><span class="chat-role">You</span><span class="chat-text">' + firstTurn.q + '</span></div>' +
          '<div class="chat-line chat-line-ai"><span class="chat-role">' + s.label + '</span><span class="chat-text">' + firstTurn.a + '</span></div>' +
          '<div class="chat-line chat-line-user"><span class="chat-role">You</span><span class="chat-text">' + lastTurn.q + '</span></div>' +
          '<div class="chat-line chat-line-ai"><span class="chat-role">' + s.label + '</span><span class="chat-text" id="chat-answer-text"></span><span class="terminal-cursor" id="chat-cursor"></span></div>'
        : '<div class="chat-line chat-line-user"><span class="chat-role">You</span><span class="chat-text">' + firstTurn.q + '</span></div>' +
          '<div class="chat-line chat-line-ai"><span class="chat-role">' + s.label + '</span><span class="chat-text" id="chat-answer-text"></span><span class="terminal-cursor" id="chat-cursor"></span></div>';
      var failoverNotice = root.querySelector("#chat-failover-notice");
      if (failoverNotice) failoverNotice.remove();

      var answerEl = log.querySelector("#chat-answer-text");
      var cursor = log.querySelector("#chat-cursor");
      var aiLines = log.querySelectorAll(".chat-line-ai");

      if (simulateFailover) {
        var notice = document.createElement("div");
        notice.id = "chat-failover-notice";
        notice.className = "chat-failover";
        notice.innerHTML = '<span class="status-dot warn"></span> ' + s.label + ' timed out — rerouting to backup model…';
        log.insertBefore(notice, aiLines[aiLines.length - 1]);
        setTimeout(function () {
          notice.innerHTML = '<span class="status-dot on"></span> Recovered on backup model — no action needed';
          window.GovernAI.typeText(answerEl, lastTurn.a, { onDone: function () { typing = false; cursor.style.display = "none"; } });
        }, 900);
      } else {
        window.GovernAI.typeText(answerEl, lastTurn.a, { onDone: function () { typing = false; cursor.style.display = "none"; } });
      }
      if (statusEl) statusEl.textContent = s.label + " — streaming";
    }

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        current = pill.getAttribute("data-model-pill");
        render(current, current === "claude");
      });
    });

    render(current, false);
  }

  /* ==================================================================
     SHADOW MODE — toggle between enforced / silent-audit
     ================================================================== */
  function initShadowMode() {
    var root = document.getElementById("shadow-mode-widget");
    if (!root) return;
    var toggle = root.querySelector("[data-toggle]");
    var label = root.querySelector("#shadow-mode-label");
    var rows = root.querySelectorAll("[data-shadow-row]");

    function apply(on) {
      label.textContent = on ? "Shadow Mode — monitoring only" : "Live — policy enforced";
      rows.forEach(function (row) {
        var would = row.getAttribute("data-shadow-row") === "block";
        var badge = row.querySelector(".badge");
        if (!badge) return;
        if (on) {
          badge.className = "badge badge-warn";
          badge.textContent = would ? "Would block" : "Would allow";
        } else {
          badge.className = would ? "badge badge-danger" : "badge badge-success";
          badge.textContent = would ? "Blocked" : "Allowed";
        }
      });
    }
    toggle.addEventListener("toggle:change", function (e) { apply(e.detail.on); });
    apply(toggle.classList.contains("on"));
  }

  /* ==================================================================
     BUDGET SLIDER — spend vs. limit, 50/80/100% alert states
     ================================================================== */
  function initBudgetSlider() {
    var root = document.getElementById("budget-widget");
    if (!root) return;
    var slider = root.querySelector("#budget-slider");
    var fill = root.querySelector("#budget-fill");
    var pctLabel = root.querySelector("#budget-pct");
    var spendLabel = root.querySelector("#budget-spend");
    var alertBox = root.querySelector("#budget-alert");
    var limit = 12000;

    function update(pct) {
      fill.style.width = pct + "%";
      fill.classList.toggle("warn", pct >= 80);
      pctLabel.textContent = pct + "%";
      spendLabel.textContent = "$" + Math.round(limit * pct / 100).toLocaleString() + " of $" + limit.toLocaleString();
      if (pct >= 100) {
        alertBox.innerHTML = '<span class="status-dot danger"></span> Limit reached — AI access paused for this team until next cycle';
        alertBox.className = "budget-alert show danger";
      } else if (pct >= 80) {
        alertBox.innerHTML = '<span class="status-dot warn"></span> 80% alert sent to #finance-ops on Slack';
        alertBox.className = "budget-alert show warn";
      } else if (pct >= 50) {
        alertBox.innerHTML = '<span class="status-dot warn"></span> 50% alert sent to team lead by email';
        alertBox.className = "budget-alert show info";
      } else {
        alertBox.className = "budget-alert";
      }
    }
    slider.addEventListener("input", function () { update(parseInt(slider.value, 10)); });
    update(parseInt(slider.value, 10));
  }

  /* ==================================================================
     CONNECTORS + CITATIONS — click a connector to reveal a cited answer
     ================================================================== */
  function initConnectors() {
    var root = document.getElementById("connectors-widget");
    if (!root) return;
    var items = root.querySelectorAll("[data-connector]");
    var citeBody = root.querySelector("#citation-body");
    var citations = {
      confluence: { doc: "Remote Work Policy v4.pdf", excerpt: "Employees may expense home-office equipment up to $500 annually, submitted via the Finance portal within 30 days of purchase.", q: "What's our home office equipment policy?" },
      slack: { doc: "#eng-incidents — Mar 14 thread", excerpt: "Root cause: connection pool exhaustion after the 2pm deploy. Mitigated by rolling back to v2.44.1 at 2:37pm.", q: "What caused the March 14 outage?" },
      salesforce: { doc: "Opportunity: Meridian Health — Stage: Negotiation", excerpt: "Deal value $220k ARR, expected close Sep 30. Blocker noted: security questionnaire pending legal review.", q: "What's the status of the Meridian Health deal?" },
      sharepoint: { doc: "Q3 Board Deck.pptx, slide 14", excerpt: "ARR grew 18% QoQ to $4.2M, driven primarily by Enterprise-tier upsells (+$310k).", q: "What did the board deck say about Q3 ARR growth?" }
    };
    function render(key) {
      var c = citations[key];
      citeBody.innerHTML =
        '<div class="chat-line chat-line-user"><span class="chat-role">You</span><span class="chat-text">' + c.q + '</span></div>' +
        '<div class="citation-panel"><p>' + c.excerpt + '</p>' +
        '<div class="citation-source"><span class="material-symbols-outlined" style="font-size:16px;">description</span>' + c.doc + '</div></div>';
    }
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        items.forEach(function (i) { i.classList.remove("active"); });
        item.classList.add("active");
        render(item.getAttribute("data-connector"));
      });
    });
    render(items[0].getAttribute("data-connector"));
    items[0].classList.add("active");
  }

  /* ==================================================================
     APPROVAL FLOW (HITL) — 4-step animated sequence, replayable
     ================================================================== */
  function initApprovalFlow() {
    var root = document.getElementById("approval-flow-widget");
    if (!root) return;
    var steps = root.querySelectorAll("[data-flow-step]");
    var replay = root.querySelector("#approval-replay");
    var statusLine = root.querySelector("#approval-status");
    var messages = [
      "Employee asks the assistant to update a Salesforce opportunity stage.",
      "GovernAI detects a write-intent action and pauses execution.",
      "A Compliance Officer reviews the request in the Approval Queue — the requester cannot approve their own action.",
      "Approved. Action executes and is written to the immutable audit log."
    ];
    var i = 0, timer = null;

    function show(idx) {
      steps.forEach(function (s, n) {
        s.classList.toggle("active", n === idx);
        s.classList.toggle("done", n < idx);
      });
      statusLine.textContent = messages[idx];
    }
    function run() {
      clearInterval(timer);
      i = 0; show(0);
      if (reduced) { show(steps.length - 1); return; }
      timer = setInterval(function () {
        i++;
        if (i >= steps.length) { clearInterval(timer); return; }
        show(i);
      }, 1500);
    }
    if (replay) replay.addEventListener("click", run);
    run();
  }

  /* ==================================================================
     EMERGENCY STOP — deliberate confirm, org-wide paused banner
     ================================================================== */
  function initEmergencyStop() {
    var root = document.getElementById("estop-widget");
    if (!root) return;
    var btn = root.querySelector("#estop-button");
    var banner = root.querySelector("#estop-banner");
    var confirmRow = root.querySelector("#estop-confirm");
    var stopped = false;

    btn.addEventListener("click", function () {
      if (stopped) {
        stopped = false;
        banner.classList.remove("show");
        btn.textContent = "Emergency Stop";
        btn.classList.remove("btn-outline");
        btn.classList.add("btn-danger");
        return;
      }
      confirmRow.classList.add("show");
    });
    root.querySelectorAll("[data-estop-confirm]").forEach(function (b) {
      b.addEventListener("click", function () {
        var yes = b.getAttribute("data-estop-confirm") === "yes";
        confirmRow.classList.remove("show");
        if (yes) {
          stopped = true;
          banner.classList.add("show");
          btn.textContent = "Restore AI Access";
          btn.classList.remove("btn-danger");
          btn.classList.add("btn-outline");
        }
      });
    });
  }

  /* ==================================================================
     AUDIT LOG — filterable mock table
     ================================================================== */
  function initAuditLog() {
    var root = document.getElementById("audit-log-widget");
    if (!root) return;
    var search = root.querySelector("#audit-search");
    var filterBtns = root.querySelectorAll("[data-audit-filter]");
    var rows = root.querySelectorAll("tbody tr");
    var activeFilter = "all";

    function apply() {
      var term = (search.value || "").toLowerCase();
      rows.forEach(function (row) {
        var text = row.textContent.toLowerCase();
        var matchesTerm = !term || text.indexOf(term) !== -1;
        var matchesFilter = activeFilter === "all" || row.getAttribute("data-event-type") === activeFilter;
        row.style.display = (matchesTerm && matchesFilter) ? "" : "none";
      });
    }
    search.addEventListener("input", apply);
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFilter = btn.getAttribute("data-audit-filter");
        apply();
      });
    });
  }

  /* ==================================================================
     CMK VAULT — click to revoke key, data becomes unreadable
     ================================================================== */
  function initCmkVault() {
    var root = document.getElementById("cmk-widget");
    if (!root) return;
    var btn = root.querySelector("#cmk-revoke");
    var rows = root.querySelectorAll("[data-cmk-row]");
    var status = root.querySelector("#cmk-status");
    var revoked = false;
    btn.addEventListener("click", function () {
      revoked = !revoked;
      rows.forEach(function (row) { row.textContent = revoked ? "████████████" : row.getAttribute("data-cmk-row"); });
      status.innerHTML = revoked
        ? '<span class="status-dot danger"></span> Key revoked — all data permanently unreadable'
        : '<span class="status-dot on"></span> Key active — data readable by your systems only';
      btn.textContent = revoked ? "Restore Key (demo)" : "Revoke Key";
    });
  }

  /* ==================================================================
     SAVINGS COUNTERS — driven by data-count-to, handled in shared.js;
     this just wires the technique tab switcher on the cost section.
     ================================================================== */

  /* ==================================================================
     TEAM DRILLDOWN — click a team row to reveal individual member spend
     Markup: [data-team-group] > [data-team-toggle] + [data-team-members]
     ================================================================== */
  function initTeamDrilldown() {
    var groups = document.querySelectorAll("[data-team-group]");
    if (!groups.length) return;
    groups.forEach(function (group) {
      var toggle = group.querySelector("[data-team-toggle]");
      if (!toggle) return;
      function set(open) {
        group.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      }
      toggle.addEventListener("click", function () { set(!group.classList.contains("open")); });
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set(!group.classList.contains("open")); }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeroChat();
    initShadowMode();
    initBudgetSlider();
    initConnectors();
    initApprovalFlow();
    initEmergencyStop();
    initAuditLog();
    initCmkVault();
    initTeamDrilldown();
  });
})();
