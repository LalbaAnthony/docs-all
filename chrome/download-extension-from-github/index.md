# How to Install a Chrome Extension from GitHub

This guide walks you through downloading and installing a Chrome extension from a GitHub repository - no coding tools.

## What You Need

- Google Chrome browser
- Internet access
- The GitHub repository URL of the extension

## Step 1 - Download the Extension Files

1. Open the GitHub repository page in Chrome. The URL will look something like this:
   ```
   https://github.com/username/repository
   ```
2. Click the green **"Code"** button near the top right of the page (screenshot below).
3. In the dropdown, click **"Download ZIP"**.
4. Once downloaded, locate the ZIP file in your **Downloads** folder.
5. **Right-click** the ZIP file and choose **"Extract All..."** (Windows) or double-click it (Mac).
6. Choose a destination folder you'll remember (e.g., `Documents/my-extension`) and click **Extract**.

   > Keep this folder where it is - Chrome will need it every time it loads the extension.

   <img src="https://raw.githubusercontent.com/LalbaAnthony/antho-docs/main/chrome/download-extension-from-github/assets/download-screenshot.png" alt="GitHub Download ZIP" width="400"/>

## Step 2 - Enable Developer Mode in Chrome

Chrome requires Developer Mode to load extensions that are not from the Chrome Web Store.

1. Open Chrome and type the following in the address bar, then press **Enter**:
   ```
   chrome://extensions
   ```
2. In the top-right corner of the page, toggle **"Developer mode"** ON.

   > A new set of buttons will appear at the top left.

## Step 3 - Load the Extension

1. Click **"Load unpacked"** (top left of the Extensions page).
2. A file picker will open. Navigate to the folder you extracted in Step 1.
3. Select the folder and click **"Select Folder"** (Windows) or **"Open"** (Mac).

   > Important: select the folder itself where the `manifest.json` file is located, not a file inside it.

4. The extension should now appear in your extensions list and be active.

## Keeping the Extension Up to Date

GitHub extensions are not updated automatically. To get a newer version:

1. Go back to the GitHub repository page.
2. Repeat Steps 1–3 with the new download.
3. On the Extensions page, the existing entry will refresh automatically once you reload the unpacked folder.

## Troubleshooting

**"Manifest file is missing or unreadable"**
You selected the wrong folder. Make sure you select the folder that contains a file named `manifest.json`. If the ZIP extracted into a subfolder, open that subfolder and select it instead.

**The extension disappeared after restarting Chrome**
This is normal for unpacked extensions if the folder was moved or deleted. Make sure the extracted folder stays in place. If it moved, reload it via **"Load unpacked"** again.

**Chrome says the extension is unsafe**
This warning is standard for extensions not installed from the Web Store. If you trust the source (e.g., your company or a known developer), click **"Keep"** to proceed.
