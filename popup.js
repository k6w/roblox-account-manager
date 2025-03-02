class AccountManager {
    constructor() {
        this.accounts = [];
        this.Debugging = true;
        this.initializeEventListeners();
        this.loadAccounts();
        this.initializeCustomUI();
        this.cookieHandler = null;
        this.initializeCookieHandler();
    }

    debug(...args) {
        if (this.Debugging) {
            console.log('[Roblox Account Manager]', ...args);
        }
    }

    async initializeCookieHandler() {
        try {
            const { default: CookieHandler } = await import(chrome.runtime.getURL('cookieHandler.js'));
            this.cookieHandler = new CookieHandler();
            this.cookieHandler.setDebug(this.Debugging);
            this.debug('CookieHandler initialized');
        } catch (error) {
            this.debug('Failed to initialize CookieHandler:', error);
        }
    }

    initializeCustomUI() {
        document.getElementById('alertOk').addEventListener('click', () => {
            document.getElementById('alertOverlay').classList.add('hidden');
            if (this._alertCallback) {
                this._alertCallback();
                this._alertCallback = null;
            }
        });

        document.getElementById('editCancel').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('editSave').addEventListener('click', () => {
            this.saveEditChanges();
        });

        document.getElementById('saveCurrentAccount').addEventListener('click', () => {
            this.saveCurrentAccount();
        });
    }

    async initializeEventListeners() {
        document.getElementById('addAccount').addEventListener('click', () => this.addAccount());
        document.getElementById('importAccounts').addEventListener('click', () => this.importAccounts());
        document.getElementById('exportAccounts').addEventListener('click', () => this.exportAccounts());
        document.getElementById('accountInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addAccount();
        });

        const accountInput = document.getElementById('accountInput');
        const syntaxTooltip = document.createElement('div');
        syntaxTooltip.className = 'syntax-tooltip hidden';
        syntaxTooltip.innerHTML = `
            <div class="tooltip-content">
                <h3>Available formats:</h3>
                <ul>
                    <li><code>Username|Password</code> - Login with credentials</li>
                    <li><code>Username|Password|Cookie</code> - Login with cookie or credentials</li>
                </ul>
            </div>
        `;
        document.body.appendChild(syntaxTooltip);

        accountInput.addEventListener('mouseenter', () => {
            const rect = accountInput.getBoundingClientRect();
            syntaxTooltip.style.top = `${rect.bottom + 5}px`;
            syntaxTooltip.style.left = `${rect.left}px`;
            syntaxTooltip.classList.remove('hidden');
        });

        accountInput.addEventListener('mouseleave', () => {
            syntaxTooltip.classList.add('hidden');
        });
    }

    showAlert(message, type = 'error', callback = null) {
        this.debug('Showing alert:', { message, type });
        const alertMessage = document.getElementById('alertMessage');
        alertMessage.textContent = message;
        alertMessage.className = type === 'error' ? 'error-message' : 'success-message';
        document.getElementById('alertOverlay').classList.remove('hidden');
        this._alertCallback = callback;
    }

    showConfirm(message, callback) {
        this.debug('Showing confirm:', message);
        this.showAlert(message + '\n\nClick OK to proceed or close this popup to cancel.', 'info', callback);
    }

    async loadAccounts() {
        const result = await chrome.storage.local.get('accounts');
        this.accounts = result.accounts || [];
        this.debug('Accounts loaded:', this.accounts.length);
        this.renderAccounts();
    }

    async saveAccounts() {
        await chrome.storage.local.set({ accounts: this.accounts });
        this.debug('Accounts saved:', this.accounts.length);
        this.renderAccounts();
    }

    renderAccounts() {
        const accountsList = document.getElementById('accountsList');
        accountsList.innerHTML = '';

        this.accounts.forEach((account, index) => {
            const accountElement = document.createElement('div');
            accountElement.className = 'account-item';
            accountElement.innerHTML = `
                <div class="account-info">
                    <div class="username-container">
                        <div class="account-name-section">
                            <span class="username">${account.nickname || account.username || 'Cookie Only Account'}</span>
                            <div class="badges-container">
                                ${account.cookie ? '<span class="badge cookie-badge">Cookie</span>' : ''}
                                ${account.password ? '<span class="badge password-badge">Password</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="btn btn-icon btn-primary btn-login" title="Login">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                        </button>
                        <button class="btn btn-icon btn-secondary btn-edit" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-icon btn-secondary btn-delete" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            accountElement.querySelector('.btn-login').addEventListener('click', () => this.loginAccount(index));
            accountElement.querySelector('.btn-edit').addEventListener('click', () => this.editAccount(index));
            accountElement.querySelector('.btn-delete').addEventListener('click', () => this.deleteAccount(index));

            accountsList.appendChild(accountElement);
        });
    }

    validateCookie(cookie) {
        return cookie && cookie.includes('_|WARNING:-DO-NOT-SHARE-THIS');
    }

    async loginAccount(index) {
        const account = this.accounts[index];
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];

        this.debug('Attempting login for account:', account.nickname || account.username || 'Cookie Only Account');

        if (!tab.url.includes('roblox.com')) {
            this.showAlert('Please navigate to roblox.com first');
            return;
        }

        if (!this.cookieHandler) {
            this.showAlert('Cookie handler not initialized');
            return;
        }

        if (account.cookie) {
            try {
                const success = await this.cookieHandler.setCookieAndReload(account.cookie);
                if (success) {
                    this.debug('Cookie set and page reloaded');
                    window.close();
                } else {
                    throw new Error('Failed to set cookie');
                }
            } catch (error) {
                this.debug('Cookie set failed:', error);
                if (account.username && account.password) {
                    this.showConfirm('Cookie login failed. Try username/password instead?', () => {
                        this.tryCredentialLogin(account, tab.id);
                    });
                } else {
                    this.showAlert('Cookie login failed and no credentials available');
                }
            }
            return;
        }

        if (account.username && account.password) {
            this.tryCredentialLogin(account, tab.id);
        } else {
            this.showAlert('No login credentials or cookie available');
        }
    }

    async addAccount() {
        const input = document.getElementById('accountInput');
        try {
            const account = this.parseAccountString(input.value);
            this.accounts.push(account);
            await this.saveAccounts();
            input.value = '';
            this.showAlert('Account added successfully', 'success');
        } catch (error) {
            this.showAlert(error.message);
        }
    }

    async editAccount(index) {
        const account = this.accounts[index];
        const modal = document.getElementById('editModal');
        const nicknameGroup = document.getElementById('nicknameGroup');

        document.getElementById('editUsername').value = account.username || '';
        document.getElementById('editPassword').value = account.password || '';
        document.getElementById('editCookie').value = account.cookie || '';
        document.getElementById('editNickname').value = account.nickname || '';

        modal.dataset.editIndex = index;
        
        modal.classList.remove('hidden');
        nicknameGroup.classList.add('hidden');
    }

    async saveEditChanges() {
        const modal = document.getElementById('editModal');
        const index = parseInt(modal.dataset.editIndex);
        const username = document.getElementById('editUsername').value.trim();
        const password = document.getElementById('editPassword').value.trim();
        const cookie = document.getElementById('editCookie').value.trim();
        const nickname = document.getElementById('editNickname').value.trim();

        try {
            if (cookie && !this.validateCookie(cookie)) {
                throw new Error('Invalid Roblox cookie format');
            }

            if (!cookie && (!username || !password)) {
                throw new Error('Username and password are required when no cookie is provided');
            }

            if (!username && !nickname) {
                document.getElementById('nicknameGroup').classList.remove('hidden');
                throw new Error('Please enter either a username or a nickname');
            }

            this.accounts[index] = {
                username,
                password,
                cookie,
                nickname: username ? '' : nickname
            };

            await this.saveAccounts();
            this.closeEditModal();
            this.showAlert('Account updated successfully', 'success');
        } catch (error) {
            this.showAlert(error.message);
        }
    }

    closeEditModal() {
        document.getElementById('editModal').classList.add('hidden');
        document.getElementById('nicknameGroup').classList.add('hidden');
    }

    async deleteAccount(index) {
        const account = this.accounts[index];
        const name = account.nickname || account.username || 'Cookie Only Account';
        if (confirm(`Are you sure you want to delete the account "${name}"?`)) {
            this.accounts.splice(index, 1);
            await this.saveAccounts();
            this.showAlert('Account deleted successfully', 'success');
        }
    }

    tryCredentialLogin(account, tabId) {
        this.debug('Attempting credential login');
        chrome.tabs.sendMessage(tabId, {
            action: 'login',
            username: account.username,
            password: account.password
        });
        window.close();
    }

    parseAccountString(str) {
        this.debug('Parsing account string');
        const parts = str.split('|').map(p => p.trim());
        
        if (parts.length < 2 || parts.length > 3) {
            throw new Error('Invalid format. Use: USERNAME|PASSWORD|COOKIE or USERNAME|PASSWORD');
        }

        const [username, password, cookie = ''] = parts;

        if (!cookie && (!username || !password)) {
            throw new Error('Username and password are required when no cookie is provided');
        }

        if (cookie && !this.validateCookie(cookie)) {
            throw new Error('Invalid cookie format');
        }

        return { username, password, cookie };
    }

    async saveCurrentAccount() {
        this.debug('Saving current account');
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (!tab.url.includes('roblox.com')) {
                this.showAlert('Please navigate to roblox.com first');
                return;
            }

            const cookie = await this.getCurrentRobloxCookie();
            if (!cookie) {
                this.showAlert('No active Roblox session found');
                return;
            }

            if (!this.validateCookie(cookie)) {
                this.showAlert('Invalid cookie format detected');
                return;
            }

            const modal = document.getElementById('editModal');
            modal.dataset.editIndex = this.accounts.length;
            
            document.getElementById('editUsername').value = '';
            document.getElementById('editPassword').value = '';
            document.getElementById('editCookie').value = cookie;
            document.getElementById('editNickname').value = '';

            modal.classList.remove('hidden');
            document.getElementById('nicknameGroup').classList.remove('hidden');

        } catch (error) {
            this.showAlert('Failed to save current account: ' + error.message);
        }
    }

    async getCurrentRobloxCookie() {
        if (!this.cookieHandler) {
            return null;
        }
        return await this.cookieHandler.getCurrent();
    }

    async importAccounts() {
        this.debug('Importing accounts');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const content = event.target.result;
                const lines = content.split('\n');
                
                const newAccounts = lines
                    .map(line => line.trim())
                    .filter(line => line)
                    .map(line => {
                        try {
                            return this.parseAccountString(line);
                        } catch (error) {
                            this.debug('Skipping invalid line:', line, error);
                            return null;
                        }
                    })
                    .filter(account => account !== null);

                if (newAccounts.length > 0) {
                    this.accounts = [...this.accounts, ...newAccounts];
                    await this.saveAccounts();
                    this.showAlert(`Successfully imported ${newAccounts.length} accounts`, 'success');
                } else {
                    this.showAlert('No valid accounts found in the file');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    exportAccounts() {
        this.debug('Exporting accounts');
        const content = this.accounts
            .map(acc => `${acc.username || ''}|${acc.password || ''}|${acc.cookie || ''}`)
            .join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roblox_accounts.txt';
        a.click();
        
        URL.revokeObjectURL(url);
        this.showAlert('Accounts exported successfully', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AccountManager();
});
