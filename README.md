# Roblox Account Manager

A Chrome extension for securely managing multiple Roblox accounts with fast account switching capabilities.

![Roblox Account Manager](icons/icon128.png)

## Features

### Account Management
- **Store Multiple Accounts**: Securely save usernames, passwords, and cookies
- **Quick Login**: Switch between accounts with a single click
- **Nickname Support**: Add custom nicknames to easily identify your accounts
- **Visual Indicators**: At-a-glance badges show which accounts have cookies or passwords

### Authentication Methods
- **Cookie-Based Authentication**: Instantly login via secure cookie (fastest method)
- **Credential-Based Authentication**: Automatic form filling when cookie authentication fails
- **Fallback Mechanism**: Tries username/password if cookie login fails (* May need to resolve captcha manually when this happens)

### Import/Export
- **Account Backup**: Export all your stored accounts to a text file
- **Easy Restoration**: Import accounts from previously exported files
- **Format Compatibility**: Supports multiple input formats for flexibility

### Security
- **Local Storage**: All account data is stored locally in your browser
- **Cookie Validation**: Built-in validation of Roblox security cookie format
- **No Remote Servers**: Your account data never leaves your computer

## Installation

1. Download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer Mode" by clicking the toggle in the top right
4. Click "Load Unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

## Usage

### Adding Accounts

You can add accounts in several ways:

1. **Manual Entry**: Enter account details in one of these formats:
   - `username|password` - Basic login credentials
   - `username|password|cookie` - With cookie for faster login
   - `nickname|username|password|cookie` - Full details with custom nickname

2. **Save Current Account**: When logged into Roblox, click "Save Current" to store the active session

3. **Import**: Click "Import" to load accounts from a text file

### Switching Accounts

1. Click the extension icon to open the account manager
2. Find the account you want to use
3. Click the login button (arrow icon)
4. The extension will automatically log you in using the stored credentials

### Managing Accounts

- **Edit**: Click the pencil icon to modify account details or add a nickname
- **Delete**: Click the trash icon to remove an account
- **Export**: Click "Export" to save all accounts to a text file

## FAQ

**Q: Is this safe to use?**  
A: Yes. All data is stored locally in your browser and never sent to any third-party servers.

**Q: Will this get my Roblox account banned?**  
A: No. The extension uses standard login methods and doesn't violate Roblox's Terms of Service.

**Q: Can I use this on multiple computers?**  
A: Yes. Use the Export feature on one computer and Import on another.

**Q: What if my cookie expires?**  
A: The extension will automatically fall back to username/password login if available.

## Troubleshooting

- **Login fails**: Make sure you're on a Roblox website before attempting to login
- **Cookie not working**: Cookies may expire; try updating it or using username/password
- **Import not working**: Ensure your import file uses the correct format

## Credits

Developed with ❤️ by the Selective Team  
[https://selective.lol](https://selective.lol)

## Disclaimer

This extension is not affiliated with, endorsed by, or related to Roblox Corporation.
