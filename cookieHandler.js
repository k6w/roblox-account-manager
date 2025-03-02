export default class CookieHandler {
    constructor() {
        this.debug = true;
        this.currentTab = null;
    }

    createNetscapeCookieFormat(cookieValue) {
        const now = Math.floor(Date.now() / 1000);
        const expiry = now + (365 * 24 * 60 * 60);
        return [
            '.roblox.com\tTRUE\t/\tFALSE\t' + expiry + '\t.ROBLOSECURITY\t' + cookieValue,
            'www.roblox.com\tTRUE\t/\tFALSE\t' + expiry + '\t.ROBLOSECURITY\t' + cookieValue
        ].join('\n');
    }

    log(...args) {
        if (this.debug) {
            console.log('[Roblox Account Manager - Cookie]', ...args);
        }
    }

    async setDebug(enabled) {
        this.debug = enabled;
    }

    async getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tab;
        return tab;
    }

    async removeCookie(domain) {
        this.log('Removing cookie from domain:', domain);
        try {
            await chrome.cookies.remove({
                url: `https://${domain}`,
                name: '.ROBLOSECURITY'
            });
            this.log('Cookie removed successfully from:', domain);
            return true;
        } catch (error) {
            this.log('Error removing cookie:', error);
            return false;
        }
    }

    async setCookie(cookieValue) {
        this.log('Starting cookie set process');
        try {
            const tab = await this.getCurrentTab();
            if (!tab.url.includes('roblox.com')) {
                throw new Error('Not on Roblox website');
            }

            const domains = ['www.roblox.com', 'roblox.com', '.roblox.com', '.www.roblox.com'];
            for (const domain of domains) {
                await this.removeCookie(domain);
            }

            const success = await this.setViaChromeCookies(cookieValue);
            if (success) {
                this.log('Cookie set successfully via chrome.cookies');
                return true;
            }

            this.log('Attempting to set cookie via content script');
            return await this.setViaContentScript(cookieValue, tab.id);
        } catch (error) {
            this.log('Error in setCookie:', error);
            return false;
        }
    }

    async setViaChromeCookies(cookieValue) {
        try {
            const cookieData = {
                url: 'https://www.roblox.com',
                name: '.ROBLOSECURITY',
                value: cookieValue,
                domain: 'www.roblox.com',
                path: '/',
                secure: false,
                httpOnly: false,
                sameSite: 'unspecified',
                hostOnly: true
            };

            this.log('Setting cookie via chrome.cookies.set');
            const cookie = await chrome.cookies.set(cookieData);
            
            if (!cookie) {
                throw new Error('Failed to set cookie - no cookie returned');
            }

            const verification = await this.verifyCookie();
            if (!verification.exists || verification.value !== cookieValue) {
                throw new Error('Cookie verification failed');
            }

            return true;
        } catch (error) {
            this.log('Error in setViaChromeCookies:', error);
            return false;
        }
    }

    async setViaContentScript(cookieValue, tabId) {
        return new Promise((resolve) => {
            this.log('Injecting cookie script');

            const cookieFileContent = this.createNetscapeCookieFormat(cookieValue);
            this.log('Using Netscape cookie format:', cookieFileContent);

            chrome.scripting.executeScript({
                target: { tabId },
                func: (value, cookieFile) => {
                    try {
                        document.cookie = `.ROBLOSECURITY=${value}; path=/; domain=.roblox.com`;
                        document.cookie = `.ROBLOSECURITY=${value}; path=/; domain=www.roblox.com`;

                        const lines = cookieFile.split('\n');
                        lines.forEach(line => {
                            const parts = line.split('\t');
                            if (parts.length >= 7) {
                                const [domain, , path, secure, expiry, name, value] = parts;
                                const cookieString = `${name}=${value}; path=${path}; domain=${domain}${secure.toLowerCase() === 'true' ? '; secure' : ''}`;
                                document.cookie = cookieString;
                            }
                        });

                        return true;
                    } catch (error) {
                        console.error('Error setting cookie via script:', error);
                        return false;
                    }
                },
                args: [cookieValue, cookieFileContent]
            }).then(async (results) => {
                const success = results?.[0]?.result;
                this.log('Script injection result:', success);
                
                const verification = await this.verifyCookie();
                resolve(verification.exists && verification.value === cookieValue);
            }).catch((error) => {
                this.log('Script injection error:', error);
                resolve(false);
            });
        });
    }

    async setCookieAndReload(cookieValue) {
        const success = await this.setCookie(cookieValue);
        if (success) {
            const tab = await this.getCurrentTab();
            if (tab) {
                await chrome.tabs.reload(tab.id);
            }
        }
        return success;
    }

    async verifyCookie() {
        try {
            const cookie = await chrome.cookies.get({
                url: 'https://www.roblox.com',
                name: '.ROBLOSECURITY'
            });

            return {
                exists: !!cookie,
                value: cookie ? cookie.value : null
            };
        } catch (error) {
            this.log('Error verifying cookie:', error);
            return { exists: false, value: null };
        }
    }

    async getCurrent() {
        try {
            const cookie = await chrome.cookies.get({
                url: 'https://www.roblox.com',
                name: '.ROBLOSECURITY'
            });
            return cookie ? cookie.value : null;
        } catch (error) {
            this.log('Error getting current cookie:', error);
            return null;
        }
    }

    validateCookie(cookieValue) {
        return cookieValue && cookieValue.includes('_|WARNING:-DO-NOT-SHARE-THIS');
    }

    setupCookieListener(callback) {
        chrome.cookies.onChanged.addListener((changeInfo) => {
            if (changeInfo.cookie.name === '.ROBLOSECURITY' && 
                changeInfo.cookie.domain.includes('roblox.com')) {
                this.log('Cookie change detected:', {
                    removed: changeInfo.removed,
                    cause: changeInfo.cause,
                    domain: changeInfo.cookie.domain
                });
                if (callback) callback(changeInfo);
            }
        });
    }
}
