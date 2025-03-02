let Debugging = true;

function debug(...args) {
    if (Debugging) {
        console.log('[Roblox Account Manager - Content]', ...args);
    }
}

function setCookieInPage(cookieValue) {
    debug('Attempting to set cookie directly in page');
    try {
        document.cookie = `.ROBLOSECURITY=${cookieValue}; domain=.roblox.com; path=/`;
        document.cookie = `.ROBLOSECURITY=${cookieValue}; domain=www.roblox.com; path=/`;

        document.cookie = `.ROBLOSECURITY=${cookieValue}; domain=.roblox.com; path=/; secure=false; samesite=lax`;
        document.cookie = `.ROBLOSECURITY=${cookieValue}; domain=www.roblox.com; path=/; secure=false; samesite=lax`;

        const cookies = document.cookie.split(';');
        const found = cookies.some(c => c.trim().startsWith('.ROBLOSECURITY='));
        
        debug('Cookie set result:', found);
        return found;
    } catch (error) {
        debug('Error setting cookie:', error);
        return false;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debug('Message received:', message);

    if (message.action === 'setDebugging') {
        Debugging = message.enabled;
        debug('Debugging mode:', Debugging ? 'enabled' : 'disabled');
        return;
    }

    if (message.action === 'setCookie') {
        debug('Received setCookie request');
        const success = setCookieInPage(message.cookie);
        if (success) {
            debug('Cookie set successfully, reloading page');
            window.location.reload();
        }
        sendResponse({ success });
        return true;
    }

    if (message.action === 'login') {
        debug('Received login request with credentials');
        handleLogin(message.username, message.password);
    }

    if (message.action === 'cookieChanged') {
        debug('Cookie change notification:', message);
        if (!message.removed) {
            if (message.cookie && message.cookie.value) {
                const success = setCookieInPage(message.cookie.value);
                debug('Direct cookie set result:', success);
            }
            setTimeout(() => {
                debug('Reloading page after cookie change');
                window.location.reload();
            }, 1000);
        }
    }

    if (message.action === 'showLoginConfirm') {
        debug('Showing login confirmation');
        showLoginDialog(message.message);
    }
});

function showLoginDialog(message) {
    debug('Creating login dialog');
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        color: white;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #424242;
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;

    dialog.innerHTML = `
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .dialog-btn {
                background: #424242;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.3s;
                margin-left: 8px;
            }
            .dialog-btn.primary {
                background: #00b0ff;
            }
            .dialog-btn:hover {
                filter: brightness(1.2);
            }
        </style>
        <p style="margin: 0 0 15px 0;">${message}</p>
        <div style="display: flex; justify-content: flex-end;">
            <button class="dialog-btn">Cancel</button>
            <button class="dialog-btn primary">Try Login</button>
        </div>
    `;

    dialog.querySelector('.dialog-btn.primary').addEventListener('click', () => {
        debug('Login retry confirmed');
        document.body.removeChild(dialog);
        tryAutoLogin();
    });

    dialog.querySelector('.dialog-btn').addEventListener('click', () => {
        debug('Login retry cancelled');
        document.body.removeChild(dialog);
    });

    setTimeout(() => {
        if (document.body.contains(dialog)) {
            document.body.removeChild(dialog);
        }
    }, 10000);

    document.body.appendChild(dialog);
}

async function handleLogin(username, password) {
    try {
        debug('Waiting for login elements');
        await waitForElement('#login-username');
        await waitForElement('#login-password');
        await waitForElement('#login-button');

        const usernameField = document.querySelector('#login-username');
        const passwordField = document.querySelector('#login-password');
        const loginButton = document.querySelector('#login-button');

        debug('Setting login credentials');
        typeIntoField(usernameField, username);
        typeIntoField(passwordField, password);

        debug('Clicking login button');
        loginButton.click();

        waitForLoginComplete();
    } catch (error) {
        debug('Login automation failed:', error);
    }
}

function waitForElement(selector, timeout = 10000) {
    debug('Waiting for element:', selector);
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            debug('Element found immediately:', selector);
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                debug('Element found after waiting:', selector);
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for element: ${selector}`));
        }, timeout);
    });
}

function typeIntoField(element, text) {
    debug('Typing into field:', text);
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

function waitForLoginComplete() {
    debug('Monitoring login completion');
    const observer = new MutationObserver((mutations) => {
        if (window.location.pathname === '/' || document.querySelector('.login-error')) {
            debug('Login process completed');
            observer.disconnect();
            
            const errorElement = document.querySelector('.login-error');
            if (errorElement) {
                debug('Login error detected:', errorElement.textContent);
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function tryAutoLogin() {
    debug('Attempting auto-login');
    const loginButton = document.querySelector('#login-button');
    if (loginButton) {
        debug('Found login button, clicking');
        loginButton.click();
    } else {
        debug('No login button found');
    }
}
