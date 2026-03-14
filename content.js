let config = { mode: 'smart', shortcut: { ctrl: true, key: 'Space', code: 'Space' }, gracePeriod: 500 };
let safetyTimer = null;

chrome.storage.sync.get(['config'], (result) => {
    if (result.config) config = result.config;
});

// Listen for storage changes in real-time
chrome.storage.onChanged.addListener((changes) => {
    if (changes.config) config = changes.config.newValue;
});

document.addEventListener('keydown', (event) => {
    const isChatGPT = window.location.hostname.includes('chatgpt.com');
    const isGemini = window.location.hostname.includes('gemini.google.com');
    const target = event.target;

    if (target.tagName !== 'TEXTAREA' && target.tagName !== 'DIV' && target.contentEditable !== 'true') return;

    // --- MODE 1: STRICT (Reclaim Enter) ---
    if (config.mode === 'strict') {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            document.execCommand('insertText', false, '\n');
            return;
        }

        // Custom Send Shortcut
        const isCtrlMatch = config.shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        if (isCtrlMatch && (event.code === config.shortcut.code || event.key === config.shortcut.key)) {
            event.preventDefault();
            triggerSend(isChatGPT, isGemini);
        }
    }

    // --- MODE 2: SMART (The Safety Net) ---
    if (config.mode === 'smart') {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();

            // 1. Immediately act like a typewriter: Insert the newline
            document.execCommand('insertText', false, '\n');

            // 2. Start the "Send" timer
            clearTimeout(safetyTimer);
            safetyTimer = setTimeout(() => {
                triggerSend(isChatGPT, isGemini);
                safetyTimer = null;
            }, config.gracePeriod);

        } else if (safetyTimer) {
            // If user types ANYTHING (except Enter) during the wait, 
            // we just kill the timer. The newline is already there!
            clearTimeout(safetyTimer);
            safetyTimer = null;
        }
    }
}, true);

function triggerSend(isChatGPT, isGemini) {
    let btn;
    if (isChatGPT) btn = document.querySelector('button[data-testid="send-button"]');
    if (isGemini) btn = document.querySelector('.send-button-container button.send-button, button[aria-label="Send message"].submit');

    if (btn && (btn.disabled === false || btn.getAttribute('aria-disabled') !== 'true')) {
        btn.click();
    }
}