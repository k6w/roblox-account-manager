# Roblox Account Manager

A Chrome extension for efficiently managing multiple Roblox accounts with secure login capabilities.

![Roblox Account Manager](icons/icon128.png)

## Overview

Roblox Account Manager allows you to store and quickly switch between multiple Roblox accounts. It offers both cookie-based and credential-based authentication, with a clean and intuitive user interface designed for ease of use.

## Features

- **Multiple Authentication Methods**:
  - Username/password login
  - Cookie-based authentication
  - Combined authentication (fallback from cookie to credentials)

- **Account Management**:
  - Add accounts with format: `Username|Password` or `Username|Password|Cookie`
  - Edit account details (username, password, cookie, nickname)
  - Delete accounts
  - One-click login to any stored account

- **Backup & Restore**:
  - Import accounts from text file
  - Export accounts to text file
  - Format compatibility with common Roblox tools

- **Current Account Handling**:
  - Save currently logged-in account with "Save Current" button
  - Automatic cookie extraction

- **User Interface**:
  - Clean dark theme interface
  - Visual indicators for account types (cookie badge, password badge)
  - Helpful tooltips for input formats
  - Confirmation dialogs for important actions
  - Status notifications

- **Security**:
  - Local storage of credentials (not transmitted to external servers)
  - Cookie validation before saving

## Implementation Details

### Core Components

1. **AccountManager**: Main class that handles the user interface and account operations
   - Account storage and retrieval via Chrome storage API
   - UI rendering and event handling
   - Import/export functionality
   - Modal and notification systems

2. **CookieHandler**: Specialized module for cookie manipulation
   - Multiple cookie setting strategies (Chrome API, document.cookie)
   - Cookie validation and verification
   - Cookie extraction from current session

3. **[Background Service](background.js)**: Extension's background process
   - Initializes cookie handler
   - Handles background messaging
   - Monitors cookie changes

4. **[Content Script](content.js)**: Injected into Roblox pages
   - Automated form filling for credential login
   - Direct cookie manipulation in page context
   - Login process monitoring

### Technical Implementation

- **Module System**: Uses ES6 modules for code organization
- **Chrome API Integration**:
  - `chrome.storage.local` for storing accounts
  - `chrome.cookies` API for cookie manipulation
  - `chrome.tabs` API for tab interaction
  - `chrome.runtime` messaging for component communication
- **Modern UI**: Custom CSS with animations, responsive design, and visual feedback
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Debug Mode**: Built-in debug logging system for troubleshooting

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer Mode" (toggle in the top-right corner)
4. Click "Load Unpacked" and select the extension directory
5. The extension icon should appear in your browser toolbar

## Usage

### Adding Accounts

1. Click the extension icon to open the popup
2. Enter account details in the input field using one of these formats:
   - `Username|Password` - For credential login
   - `Username|Password|Cookie` - For cookie login with credential fallback
3. Click "Add Account" or press Enter

### Logging Into an Account

1. Navigate to [Roblox.com](https://www.roblox.com/)
2. Open the extension popup
3. Click the login button (arrow icon) next to the desired account

### Saving Current Account

1. While logged into Roblox, click the extension icon
2. Click "Save Current" button at the top
3. Add a nickname if desired (especially for cookie-only accounts)
4. Click "Save"

### Import/Export

- **Import**: Click the "Import" button and select a text file with accounts
- **Export**: Click the "Export" button to download all accounts as a text file

## Security Considerations

- Your account credentials and cookies are stored locally in your browser
- No data is transmitted to external servers
- When sharing your computer, remember that anyone with access to your Chrome profile can access your stored accounts
- Cookie format validation ensures proper Roblox cookie structure

## Credits

Made by Selective Team
