let Debugging = false;
let cookieHandler = null;

function debug(...args) {
    if (Debugging) {
        console.log('[Roblox Account Manager]', ...args);
    }
}

async function initializeCookieHandler() {
    try {
        const response = await import(chrome.runtime.getURL('cookieHandler.js'));
        cookieHandler = new response.default();
        cookieHandler.setDebug(Debugging);

        cookieHandler.setupCookieListener((changeInfo) => {
            debug('Cookie change from listener:', changeInfo);
            notifyTabsOfCookieChange(changeInfo);
        });

        debug('CookieHandler initialized');
    } catch (error) {
        debug('Failed to initialize CookieHandler:', error);
    }
}

function notifyTabsOfCookieChange(changeInfo) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url && tab.url.includes('roblox.com')) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'cookieChanged',
                    removed: changeInfo.removed,
                    cookie: changeInfo.cookie
                }).catch(() => {});
            }
        });
    });
}

chrome.runtime.onInstalled.addListener(async () => {
    debug('Extension installed/updated');
    
    const result = await chrome.storage.local.get(['accounts', 'debugging']);
    if (!result.accounts) {
        await chrome.storage.local.set({ accounts: [] });
    }
    
    Debugging = result.debugging || false;
    
    await initializeCookieHandler();
    
    debug('Initialization complete');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debug('Received message:', message);

    if (message.action === 'setDebugging') {
        Debugging = message.enabled;
        if (cookieHandler) {
            cookieHandler.setDebug(Debugging);
        }
        debug('Debugging mode:', Debugging ? 'enabled' : 'disabled');
        sendResponse({ success: true });
        return true;
    }

    if (message.action === 'setCookie') {
        if (!message.cookie) {
            sendResponse({ success: false, error: 'No cookie provided' });
            return true;
        }

        if (!cookieHandler) {
            sendResponse({ success: false, error: 'Cookie handler not initialized' });
            return true;
        }

        cookieHandler.setCookie(message.cookie)
            .then(success => {
                debug('Cookie set result:', success);
                sendResponse({ success });
            })
            .catch(error => {
                debug('Cookie set error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    if (message.action === 'checkCookie') {
        if (!cookieHandler) {
            sendResponse({ exists: false, error: 'Cookie handler not initialized' });
            return true;
        }

        cookieHandler.verifyCookie()
            .then(result => {
                sendResponse(result);
            })
            .catch(error => {
                sendResponse({ exists: false, error: error.message });
            });
        return true;
    }

    if (message.action === 'getCurrentCookie') {
        if (!cookieHandler) {
            sendResponse({ success: false, error: 'Cookie handler not initialized' });
            return true;
        }

        cookieHandler.getCurrent()
            .then(cookie => {
                sendResponse({ success: true, cookie });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});
