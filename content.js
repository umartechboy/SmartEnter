let config = { mode: 'smart', shortcut: { ctrl: true, key: 'Space', code: 'Space' }, gracePeriod: 500 };
let safetyTimer = null;
let newlineModeTimer = null;

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

    if (config.mode === 'smart') {
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                // Shift + Enter: Cancel any pending send and allow newline
                if (safetyTimer) {
                    clearTimeout(safetyTimer);
                    safetyTimer = null;
                }
                // Also enter/sustain newline mode
                if (newlineModeTimer) clearTimeout(newlineModeTimer);
                newlineModeTimer = setTimeout(() => {
                    newlineModeTimer = null;
                }, config.gracePeriod);
                
                // Let it through to the site/browser
                event.stopImmediatePropagation();
                return;
            }

            if (newlineModeTimer) {
                // Already in newline mode, let it pass naturally to browser (newline)
                // but NOT to the site's own keydown listener (send)
                event.stopImmediatePropagation();
                
                clearTimeout(newlineModeTimer);
                newlineModeTimer = setTimeout(() => {
                    newlineModeTimer = null;
                }, config.gracePeriod);
                return;
            }

            if (safetyTimer) {
                // Second Enter within timeout: Abort send and let this Enter through naturally
                clearTimeout(safetyTimer);
                safetyTimer = null;
                
                // Let the browser handle the newline, but stop the site from sending
                event.stopImmediatePropagation();

                // Enter Newline Mode
                newlineModeTimer = setTimeout(() => {
                    newlineModeTimer = null;
                }, config.gracePeriod);
                return;
            }

            // First Enter: Intercept completely (no newline, no site send)
            event.preventDefault();
            event.stopImmediatePropagation();

            safetyTimer = setTimeout(() => {
                triggerSend(isChatGPT, isGemini);
                safetyTimer = null;
            }, config.gracePeriod);

        } else {
            // User pressed a different key (not Enter)
            if (safetyTimer) {
                clearTimeout(safetyTimer);
                safetyTimer = null;
            }
            if (newlineModeTimer) {
                clearTimeout(newlineModeTimer);
                newlineModeTimer = null;
            }
        }
    }

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
}, true);

function triggerSend(isChatGPT, isGemini) {
    let btn;
    if (isChatGPT) btn = document.querySelector('button[data-testid="send-button"]');
    if (isGemini) btn = document.querySelector('.send-button-container button.send-button, button[aria-label="Send message"].submit');

    if (btn && (btn.disabled === false || btn.getAttribute('aria-disabled') !== 'true')) {
        btn.click();
    }
}