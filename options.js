let config = { mode: 'smart', shortcut: { ctrl: true, key: 'Space', code: 'Space' }, gracePeriod: 500 };

const demoChat = document.getElementById('demoChat');
const demoStatus = document.getElementById('demoStatus');
let pendingSend = null;
let newlineModeTimer = null;

// Load Settings
chrome.storage.sync.get(['config'], (result) => {
    if (result.config) config = result.config;
    document.querySelector(`input[value="${config.mode}"]`).checked = true;
    document.getElementById('gracePeriod').value = config.gracePeriod;
    document.getElementById('periodVal').textContent = config.gracePeriod;
    updateHotkeyLabel();
});

// Save Settings on Change
function save() { chrome.storage.sync.set({ config }); }

document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.addEventListener('change', (e) => { config.mode = e.target.value; save(); });
});

document.getElementById('gracePeriod').addEventListener('input', (e) => {
    config.gracePeriod = parseInt(e.target.value);
    document.getElementById('periodVal').textContent = config.gracePeriod;
    save();
});

// Hotkey Recording
let isListening = false;
const recordBtn = document.getElementById('recordButton');
recordBtn.addEventListener('click', () => {
    isListening = true;
    recordBtn.textContent = "Press key combo...";
    recordBtn.classList.add('listening');
});

document.addEventListener('keydown', (e) => {
    if (!isListening) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    e.preventDefault();
    config.shortcut = { ctrl: e.ctrlKey, key: e.key, code: e.code };
    isListening = false;
    recordBtn.classList.remove('listening');
    updateHotkeyLabel();
    save();
});

function updateHotkeyLabel() {
    const s = config.shortcut;
    recordBtn.textContent = `${s.ctrl ? 'Ctrl + ' : ''}${s.key === ' ' ? 'Space' : s.key.toUpperCase()}`;
}
demoChat.addEventListener('keydown', (e) => {
    if (config.mode === 'smart' && e.key === 'Enter') {
        if (e.shiftKey) {
            // Shift + Enter: Cancel pending send and allow newline
            if (pendingSend) {
                clearTimeout(pendingSend);
                pendingSend = null;
            }
            if (newlineModeTimer) clearTimeout(newlineModeTimer);
            newlineModeTimer = setTimeout(() => {
                newlineModeTimer = null;
            }, config.gracePeriod);
            
            e.stopImmediatePropagation();
            demoStatus.innerHTML = `<span class="status-pill intercepted">✨ Shift+Enter: Line Break Allowed</span>`;
            return;
        }

        if (newlineModeTimer) {
            e.stopImmediatePropagation();
            
            clearTimeout(newlineModeTimer);
            newlineModeTimer = setTimeout(() => {
                newlineModeTimer = null;
            }, config.gracePeriod);
            demoStatus.innerHTML = `<span class="status-pill intercepted">✨ Newline Mode: Line Break Allowed</span>`;
            return; 
        }

        if (pendingSend) {
            clearTimeout(pendingSend);
            pendingSend = null;
            
            e.stopImmediatePropagation();
            
            newlineModeTimer = setTimeout(() => {
                newlineModeTimer = null;
            }, config.gracePeriod);
            demoStatus.innerHTML = `<span class="status-pill intercepted">✨ Aborted: Line Break Confirmed</span>`;
            return;
        }

        // First Enter: Intercept
        e.preventDefault();
        e.stopImmediatePropagation();
        demoStatus.innerHTML = `<span class="status-pill intercepted">Holding for Send... (Tap Enter again to break line)</span>`;

        pendingSend = setTimeout(() => {
            demoStatus.innerHTML = `<span class="status-pill sent">🚀 PROMPT SENT!</span>`;
            demoChat.value = "";
            pendingSend = null;
        }, config.gracePeriod);

    } else if (e.key !== 'Enter') {
        if (pendingSend) {
            clearTimeout(pendingSend);
            pendingSend = null;
            demoStatus.innerHTML = `<span class="status-pill intercepted">Aborted via Typing</span>`;
        }
        if (newlineModeTimer) {
            clearTimeout(newlineModeTimer);
            newlineModeTimer = null;
        }
    }
}, true); // Use capture phase for the demo as well to simulate content.js behavior