// Listen for clicks on the extension icon in the Chrome toolbar
chrome.action.onClicked.addListener(() => {
    // Native Chrome way to open the extension's options page
    chrome.runtime.openOptionsPage();
});