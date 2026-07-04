/* Platform Console JS */
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tierBtns = document.querySelectorAll('.tier-btn');
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  const panels = document.querySelectorAll('.tab-panel');
  const chronicle = document.getElementById('chronicle-terminal');
  const toastContainer = document.getElementById('toast-container');

  // Gating elements
  const policiesGate = document.getElementById('policies-gate');
  const finopsGate = document.getElementById('finops-gate');
  const btnCanvas = document.getElementById('btn-toggle-canvas');
  const btnVoice = document.getElementById('btn-voice');
  const canvasPanel = document.getElementById('chat-canvas');
  const rowPolicyEu = document.getElementById('row-policy-eu');
  const rowPolicyAgent = document.getElementById('row-policy-agent');
  const erpLock = document.querySelector('.erp-lock');
  const apiKeysInputs = document.querySelectorAll('.key-input');
  const prefTierWarning = document.getElementById('pref-tier-warning');

  // State
  let currentTier = sessionStorage.getItem('console_tier') || 'starter';
  let currentTab = sessionStorage.getItem('console_tab') || 'chat';

  // 1. Toast
  function showToast(msg, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  // Chronicle Log
  function logChronicle(msg) {
    const entry = document.createElement('div');
    entry.className = 'chronicle-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    chronicle.appendChild(entry);
    chronicle.scrollTop = chronicle.scrollHeight;
  }

  // 2. Tier State Machine
  function activateTier(tier) {
    currentTier = tier;
    sessionStorage.setItem('console_tier', tier);
    tierBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tier === tier));
    document.getElementById('sidebar-tier-title').textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    document.getElementById('global-status-badge').textContent = tier.toUpperCase();

    // Reset UI
    btnCanvas.disabled = false;
    btnVoice.disabled = false;
    policiesGate.style.display = 'none';
    finopsGate.style.display = 'none';
    rowPolicyEu.querySelector('input').disabled = false;
    rowPolicyEu.querySelector('.policy-lock').style.display = 'none';
    rowPolicyAgent.querySelector('input').disabled = false;
    rowPolicyAgent.querySelector('.policy-lock').style.display = 'none';
    erpLock.style.display = 'none';
    document.getElementById('btn-erp-export').disabled = false;
    apiKeysInputs.forEach(i => i.disabled = false);

    // Apply gates
    if (tier === 'starter') {
      btnCanvas.disabled = true;
      btnVoice.disabled = true;
      document.getElementById('chat-container').classList.remove('canvas-open');
      policiesGate.style.display = 'flex';
      finopsGate.style.display = 'flex';
      prefTierWarning.textContent = 'Personal keys active. Upgrade to Professional for shared org keys.';
      prefTierWarning.className = 'pref-tier-note';
    } else if (tier === 'professional') {
      rowPolicyEu.querySelector('input').disabled = true;
      rowPolicyEu.querySelector('.policy-lock').style.display = 'inline-flex';
      rowPolicyAgent.querySelector('input').disabled = true;
      rowPolicyAgent.querySelector('.policy-lock').style.display = 'inline-flex';
      finopsGate.style.display = 'none';
      erpLock.style.display = 'inline-flex';
      document.getElementById('btn-erp-export').disabled = true;
      prefTierWarning.textContent = 'Shared Org API Key Enabled (Optional).';
      prefTierWarning.className = 'pref-tier-note text-indigo';
    } else if (tier === 'enterprise') {
      apiKeysInputs.forEach(i => i.disabled = true);
      prefTierWarning.textContent = 'Enterprise Policy Active: Personal keys disabled. Using central RBAC credentials.';
      prefTierWarning.className = 'pref-tier-note text-red';
    }
    logChronicle(`Tier changed to ${tier.toUpperCase()}`);
  }

  tierBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTier(btn.dataset.tier));
  });

  // 3. Tab Switcher
  function activateTab(tabId) {
    currentTab = tabId;
    sessionStorage.setItem('console_tab', tabId);
    navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
    panels.forEach(panel => panel.classList.toggle('active', panel.id === `panel-${tabId}`));

    // FinOps Animation
    if (tabId === 'finops') {
      const bars = document.querySelectorAll('.finops-charts .bar');
      bars.forEach(bar => {
        bar.style.height = '0px';
        bar.style.transition = 'height 1s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
          bar.style.height = bar.dataset.target + 'px';
        }, 100);
      });
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => activateTab(item.dataset.tab));
  });

  // 4. Chat Studio
  const chatInput = document.getElementById('chat-input-field');
  const chatSendBtn = document.getElementById('btn-chat-send');
  const chatHistory = document.getElementById('chat-history');
  const typingInd = document.getElementById('chat-typing');
  const chips = document.querySelectorAll('.chip-btn');
  const modelSelect = document.getElementById('chat-model-select');

  modelSelect.addEventListener('change', (e) => {
    document.getElementById('chat-model-indicator').textContent = e.target.value;
  });

  function appendChatMsg(text, type) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg ${type}-msg`;
    const content = document.createElement('div');
    content.className = 'msg-content';
    content.textContent = text;
    wrapper.appendChild(content);
    chatHistory.appendChild(wrapper);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return content;
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // PII / Credential Check
    if (/password|secret|postgres|mongodb/i.test(text)) {
      appendChatMsg('Request Blocked: Secret/Credential Detected', 'system');
      showToast('Egress blocked by Secret Scanning', 'error');
      chatInput.value = '';
      return;
    }
    if (/\b\d{3}-\d{2}-\d{4}\b|@/.test(text)) {
      appendChatMsg('PII Redacted before egress', 'system');
      showToast('PII Redaction Active', 'warning');
    }

    appendChatMsg(text, 'user');
    chatInput.value = '';
    typingInd.style.display = 'flex';

    setTimeout(() => {
      typingInd.style.display = 'none';
      const model = modelSelect.value;
      let replyText = 'Response';
      if (model.includes('GPT')) replyText = 'Detailed analysis of your request...';
      else if (model.includes('Claude')) replyText = 'Here is a nuanced perspective...';
      else if (model.includes('Gemini')) replyText = 'Concise response: Done.';
      else replyText = 'Direct output generated.';

      const replyEl = appendChatMsg('', 'model');
      let i = 0;
      const words = replyText.split(' ');
      const interval = setInterval(() => {
        if (i < words.length) {
          replyEl.textContent += (i > 0 ? ' ' : '') + words[i];
          chatHistory.scrollTop = chatHistory.scrollHeight;
          i++;
        } else {
          clearInterval(interval);
        }
      }, 40);
    }, 1000);
  }

  chatSendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', e => e.key === 'Enter' && handleSend());

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.dataset.prompt;
      handleSend();
    });
  });

  // 5. Canvas
  btnCanvas.addEventListener('click', () => {
    if (currentTier === 'starter') return showToast('Canvas requires Professional tier', 'warning');
    document.getElementById('chat-container').classList.toggle('canvas-open');
  });
  document.getElementById('btn-close-canvas').addEventListener('click', () => {
    document.getElementById('chat-container').classList.remove('canvas-open');
  });

  // 6. Arena
  document.getElementById('btn-arena-compare').addEventListener('click', () => {
    const prompt = document.getElementById('arena-prompt').value;
    const grid = document.getElementById('arena-output-grid');
    grid.innerHTML = ''; // reset output - using textContent for inner content below
    const models = ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Llama 3'];
    models.forEach(model => {
      const card = document.createElement('div');
      card.className = 'arena-output-card';
      const title = document.createElement('h5');
      title.textContent = model;
      const text = document.createElement('div');
      text.className = 'output-text';

      let words = [];
      if (prompt.includes('code')) words = ['def', 'process_data(input_array):', '\n', 'return', 'sorted(input_array)'];
      else if (prompt.includes('explain')) words = ['This', 'concept', 'refers', 'to', 'the', 'methodology', 'of', 'distributed', 'consensus.'];
      else if (prompt.includes('draft')) words = ['Dear', 'Team,', 'please', 'find', 'the', 'quarterly', 'performance', 'review', 'attached.'];
      else words = ['Standard', 'output', 'generated', 'for', model];
      
      words.forEach(w => {
         const span = document.createElement('span');
         span.textContent = w + ' ';
         if (model === 'GPT-4o' && w === 'sorted(input_array)') {
             span.style.color = 'var(--color-emerald)';
             span.style.background = 'rgba(16,185,129,0.1)';
             span.textContent = 'sorted_efficiently(input_array) ';
         }
         if (model === 'Claude 3.5' && w === 'Team,') {
             span.style.color = 'var(--color-indigo)';
             span.style.background = 'rgba(99,102,241,0.1)';
             span.textContent = 'Colleagues, ';
         }
         text.appendChild(span);
      });

      card.appendChild(title);
      card.appendChild(text);
      grid.appendChild(card);
    });
  });

  // 7. Policy Toggles
  document.querySelectorAll('#policy-list input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const label = e.target.nextElementSibling.textContent;
      logChronicle(`Policy "${label}" ${e.target.checked ? 'Enabled' : 'Disabled'}`);
      showToast(`Policy updated: ${label}`, 'success');
    });
  });

  // 9. ERP Export
  document.getElementById('btn-erp-export').addEventListener('click', () => {
    if (currentTier !== 'enterprise') return showToast('Requires Enterprise tier', 'warning');
    const bar = document.getElementById('erp-progress');
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = '100%';
      setTimeout(() => {
        const blob = new Blob(['Mock ERP Data'], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'erp_export.csv';
        a.click();
        URL.revokeObjectURL(url);
        bar.style.width = '0%';
        showToast('ERP Export Complete', 'success');
      }, 3000);
    }, 50);
  });

  // 10. Preferences
  document.querySelectorAll('.toggle-pwd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.currentTarget.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
  document.getElementById('btn-save-pref').addEventListener('click', () => {
    showToast('Preferences saved successfully', 'success');
    logChronicle('User preferences updated');
  });

  // Init
  activateTier(currentTier);
  activateTab(currentTab);
});
