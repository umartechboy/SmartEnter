let config = { mode: 'smart', shortcut: { ctrl: true, key: 'Space', code: 'Space' }, gracePeriod: 500 };

const demoChat = document.getElementById('demoChat');
const demoStatus = document.getElementById('demoStatus');
let pendingSend = null;

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
// --- THE DEMO BOX LOGIC ---
demoChat.addEventListener('keydown', (e) => {
    if (config.mode === 'smart' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        // Immediate visual feedback
        const start = demoChat.selectionStart;
        const end = demoChat.selectionEnd;
        demoChat.value = demoChat.value.substring(0, start) + "\n" + demoChat.value.substring(end);
        demoChat.selectionStart = demoChat.selectionEnd = start + 1;

        demoStatus.innerHTML = `<span class="status-pill intercepted">Waiting to send...</span>`;

        clearTimeout(pendingSend);
        pendingSend = setTimeout(() => {
            demoStatus.innerHTML = `<span class="status-pill sent">🚀 PROMPT SENT!</span>`;
            demoChat.value = "";
        }, config.gracePeriod);

    } else if (pendingSend) {
        // Any other keypress cancels the send
        clearTimeout(pendingSend);
        pendingSend = null;
        demoStatus.innerHTML = `<span class="status-pill intercepted">✨ OOPS DETECTED: Keeping your text.</span>`;
    }
});