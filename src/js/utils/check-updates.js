async function checkForUpdates() {
  const version = chrome.runtime.getManifest().version;
  const response = await fetch('https://github.com/Vatsalya-singhi/yt-ad-accelerator/releases/latest');
  const latestRelease = await response.json();
  const latestVersion = latestRelease.tag_name.replace('v', '');

  if (version !== latestVersion) {
    chrome.action.setBadgeText({ text: '1' });
    chrome.storage.local.set({
      latestRelease: {
        version: latestVersion,
        downloadUrl: latestRelease.assets[0].browser_download_url,
      },
    });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.local.remove('latestRelease');
  }
}

chrome.runtime.onStartup.addListener(checkForUpdates);
chrome.runtime.onInstalled.addListener(checkForUpdates);