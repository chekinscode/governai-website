// home.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. PLAYGROUND
  const playgroundInput = document.getElementById('playground-input');
  const inspectBtn = document.getElementById('inspect-btn');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  const stepIngress = document.getElementById('step-ingress');
  const stepScanner = document.getElementById('step-scanner');
  const stepGuardrails = document.getElementById('step-guardrails');
  const stepRouter = document.getElementById('step-router');
  const scanBarContainer = document.getElementById('scan-bar-container');
  const metricsPanel = document.getElementById('metrics-panel');
  const routeDecision = document.getElementById('route-decision');
  
  const metricConfidence = document.getElementById('metric-confidence');
  const metricTokens = document.getElementById('metric-tokens');
  const metricSensitivity = document.getElementById('metric-sensitivity');

  const presets = {
    pii: "Summarize this patient record: John Doe, DOB 05/12/1980, SSN 123-45-6789. Diagnosed with hypertension.",
    creds: "Deploy script: AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE and AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY. What does this do?",
    clean: "Translate the following into French: 'The quarterly earnings report indicates a 15% growth in revenue across all enterprise sectors.'"
  };

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetType = btn.getAttribute('data-preset');
      if (playgroundInput && presets[presetType]) {
        playgroundInput.value = presets[presetType];
      }
    });
  });

  if (inspectBtn && playgroundInput) {
    inspectBtn.addEventListener('click', () => {
      const text = playgroundInput.value.trim();
      if (!text) {
        if (window.showToast) window.showToast('Please enter a prompt to scan', 'error');
        return;
      }

      // Reset UI
      [stepIngress, stepScanner, stepGuardrails, stepRouter].forEach(el => {
        if(el) {
          el.classList.remove('active', 'blocked', 'passed');
        }
      });
      if(scanBarContainer) scanBarContainer.classList.remove('hidden');
      if(metricsPanel) metricsPanel.classList.add('hidden');
      if(routeDecision) routeDecision.classList.add('hidden');

      // Determine contents
      const hasPII = /\b\d{3}-\d{2}-\d{4}\b/.test(text) || /\b(DOB|SSN)\b/i.test(text);
      const hasCreds = /(AKIA[0-9A-Z]{16})|([a-zA-Z0-9+/]{40})/i.test(text);
      const isClean = !hasPII && !hasCreds;

      // Highlight logic
      let highlightedText = text;
      if (hasPII) {
        highlightedText = highlightedText.replace(/(\b\d{3}-\d{2}-\d{4}\b)/g, '<span class="text-danger bg-danger-alpha px-1 rounded">$1</span>');
        highlightedText = highlightedText.replace(/\b(John Doe|05\/12\/1980)\b/g, '<span class="text-danger bg-danger-alpha px-1 rounded">$1</span>');
      }
      if (hasCreds) {
        highlightedText = highlightedText.replace(/(AKIA[0-9A-Z]{16})/gi, '<span class="text-danger bg-danger-alpha px-1 rounded">$1</span>');
        highlightedText = highlightedText.replace(/(wJalrXUtnFEMI\/K7MDENG\/bPxRfiCYEXAMPLEKEY)/gi, '<span class="text-danger bg-danger-alpha px-1 rounded">$1</span>');
      }

      // Sequence
      setTimeout(() => {
        if(stepIngress) stepIngress.classList.add('active');
        const overlay = document.createElement('div');
        overlay.className = 'playground-overlay';
        overlay.innerHTML = highlightedText;
        overlay.style.position = 'absolute';
        overlay.style.top = playgroundInput.offsetTop + 'px';
        overlay.style.left = playgroundInput.offsetLeft + 'px';
        overlay.style.width = playgroundInput.offsetWidth + 'px';
        overlay.style.height = playgroundInput.offsetHeight + 'px';
        overlay.style.padding = window.getComputedStyle(playgroundInput).padding;
        overlay.style.font = window.getComputedStyle(playgroundInput).font;
        overlay.style.color = window.getComputedStyle(playgroundInput).color;
        overlay.style.background = '#0F172A';
        overlay.style.borderRadius = window.getComputedStyle(playgroundInput).borderRadius;
        overlay.style.border = window.getComputedStyle(playgroundInput).border;
        overlay.style.whiteSpace = 'pre-wrap';
        overlay.style.zIndex = '10';
        overlay.style.pointerEvents = 'none';
        overlay.id = 'playground-overlay';

        // Remove old overlay if exists
        const oldOverlay = document.getElementById('playground-overlay');
        if (oldOverlay) oldOverlay.remove();
        
        if (!isClean) {
          playgroundInput.parentNode.insertBefore(overlay, playgroundInput.nextSibling);
        }
      }, 0);

      setTimeout(() => {
        if(stepIngress) stepIngress.classList.replace('active', 'passed');
        if(stepScanner) stepScanner.classList.add('active');
      }, 600);

      setTimeout(() => {
        if(scanBarContainer) scanBarContainer.classList.add('hidden');
        if(stepScanner) stepScanner.classList.replace('active', 'passed');
        if(stepGuardrails) stepGuardrails.classList.add(isClean ? 'active' : 'blocked');
        
        if(metricsPanel) {
          metricsPanel.classList.remove('hidden');
          metricConfidence.textContent = isClean ? '99.8%' : '100%';
          metricTokens.textContent = Math.ceil(text.length / 4);
          metricSensitivity.textContent = hasPII ? 'PII/PHI' : (hasCreds ? 'Secrets' : 'Low');
          if (!isClean) metricSensitivity.classList.add('text-danger');
          else metricSensitivity.classList.remove('text-danger');
        }
      }, 1200);

      setTimeout(() => {
        if (isClean) {
          if(stepGuardrails) stepGuardrails.classList.replace('active', 'passed');
          if(stepRouter) stepRouter.classList.add('passed');
          if(routeDecision) {
            routeDecision.classList.remove('hidden');
            routeDecision.className = 'route-decision success mt-4 p-3 rounded bg-emerald-alpha border border-emerald text-emerald';
            routeDecision.innerHTML = '<span class="material-symbols-outlined align-middle">check_circle</span> APPROVED: Routed to Azure OpenAI (Lowest Latency)';
          }
        } else {
          if(stepRouter) stepRouter.classList.add('blocked');
          if(routeDecision) {
            routeDecision.classList.remove('hidden');
            routeDecision.className = 'route-decision blocked mt-4 p-3 rounded bg-danger-alpha border border-danger text-danger';
            routeDecision.innerHTML = '<span class="material-symbols-outlined align-middle">block</span> BLOCKED: Policy violation. ' + (hasPII ? 'PII detected.' : 'Credentials detected.');
          }
        }
        
        // Remove overlay after 3 seconds so user can type again
        setTimeout(() => {
          const overlay = document.getElementById('playground-overlay');
          if (overlay) overlay.remove();
        }, 3000);
      }, 1800);
    });
  }

  // 2. FEATURE CARD GLOW
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 3. SHADOW AI LOG
  const auditLogBody = document.getElementById('audit-log-body');
  const shadowAiSection = document.getElementById('shadow-ai');
  if (auditLogBody && shadowAiSection) {
    const logEntries = [
      { user: 'dev_user_1', event: 'Copied AWS keys to ChatGPT', status: 'BLOCKED' },
      { user: 'mktg_team', event: 'Uploaded unreleased Q3 financials', status: 'FLAGGED' },
      { user: 'hr_admin', event: 'Pasted employee performance reviews', status: 'BLOCKED' },
      { user: 'sales_rep', event: 'Drafted email with customer PII', status: 'REDACTED' },
      { user: 'eng_lead', event: 'Sent proprietary source code to Claude', status: 'FLAGGED' },
      { user: 'support_agent', event: 'Included session tokens in prompt', status: 'BLOCKED' },
      { user: 'contractor_x', event: 'Attempted to bypass guardrails', status: 'BLOCKED' },
      { user: 'finance_mgr', event: 'Exported M&A targets to Gemini', status: 'FLAGGED' }
    ];

    let logIndex = 0;
    let logInterval;

    const addLogEntry = () => {
      const entry = logEntries[logIndex % logEntries.length];
      logIndex++;

      const logDiv = document.createElement('div');
      logDiv.className = 'log-entry fade-in';
      
      const time = new Date().toLocaleTimeString([], { hour12: false });
      
      let statusClass = 'text-amber';
      if (entry.status === 'BLOCKED') statusClass = 'text-danger';
      if (entry.status === 'REDACTED') statusClass = 'text-emerald';

      logDiv.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-user text-primary">${entry.user}</span>
        <span class="log-event">${entry.event}</span>
        <span class="log-status ${statusClass}">${entry.status}</span>
      `;

      auditLogBody.appendChild(logDiv);

      // Keep max 6 visible
      if (auditLogBody.children.length > 6) {
        auditLogBody.removeChild(auditLogBody.firstChild);
      }

      auditLogBody.scrollTop = auditLogBody.scrollHeight;
    };

    // Pre-fill a few
    for(let i=0; i<3; i++) addLogEntry();

    const logObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        logInterval = setInterval(addLogEntry, 3500);
      } else {
        clearInterval(logInterval);
      }
    }, { threshold: 0.1 });

    logObserver.observe(shadowAiSection);
  }

  // 4. STAT COUNTERS
  const counters = document.querySelectorAll('.stat-counter');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-target'));
          const duration = 1500; // 1.5s
          let startTimestamp = null;

          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // easeOutQuad
            const easeProgress = progress * (2 - progress);
            const current = easeProgress * target;
            
            // Format: if target has decimal, show 1 decimal
            if (target % 1 !== 0) {
              el.textContent = current.toFixed(1);
            } else {
              el.textContent = Math.floor(current);
            }

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              el.textContent = target; // Ensure exact final value
            }
          };

          window.requestAnimationFrame(step);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  // 5. ANIMATED FEATURE-CARD TERMINALS (Governed AI Actions + Document-Aware Answers)
  // startTerminalLoop()/cursorBlinkSpan() are defined once in shared.js (window-scoped)
  // so platform.html's deep-dive sections can reuse the exact same animation pattern.
  const approvalFlowLines = document.getElementById('approval-flow-lines');
  startTerminalLoop(approvalFlowLines, [
    '<span class="log-user" style="color: var(--color-primary);">usr_sales_04</span> &gt; <span class="log-prompt text-gray">Update the Acme opportunity to Closed-Won in Salesforce.</span>',
    '<span class="log-alert font-bold" style="color: #ffbd2e;">[WRITE INTENT DETECTED]</span> <span class="text-gray">Salesforce update requires approval</span>',
    `<span class="font-bold" style="color: #60A5FA;">[PENDING]</span> <span class="text-gray">Awaiting compliance officer review&hellip;</span>${cursorBlinkSpan('#60A5FA')}`,
    '<span class="log-block font-bold" style="color: #27c93f;">[APPROVED]</span> <span class="text-gray">Write executed. Logged to the immutable audit trail.</span>'
  ]);

  const ragFlowLines = document.getElementById('rag-flow-lines');
  startTerminalLoop(ragFlowLines, [
    '<span class="log-user" style="color: var(--color-primary);">user</span> &gt; <span class="log-prompt text-gray">What was our Q3 enterprise churn rate?</span>',
    '<span class="font-bold" style="color: #60A5FA;">[RAG]</span> <span class="text-gray">Searching SharePoint, Salesforce, and 14 documents&hellip;</span>',
    '<span class="log-block font-bold" style="color: #27c93f;">[3 SOURCES FOUND]</span> <span class="text-gray">Q3_Board_Deck.pdf &bull; SFDC: Accounts &bull; Churn_Model.xlsx</span>',
    `<span class="log-user" style="color: var(--color-primary);">assistant</span> &gt; <span class="text-gray">Enterprise churn was 4.2%.</span> <span style="color: var(--color-primary-light);">[3 citations]</span>${cursorBlinkSpan('var(--color-primary-light)')}`
  ]);
});
