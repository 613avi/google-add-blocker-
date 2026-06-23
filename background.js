// Background service worker: keeps the ad-filter lists up to date by fetching
// filters.json from GitHub. This lets the block lists improve over time WITHOUT
// shipping a new version to the Chrome Web Store — users get updates remotely.

// Raw URL of the canonical filter list in the repository (main branch).
const FILTERS_URL =
  'https://raw.githubusercontent.com/613avi/google-add-blocker-/main/filters.json';

const UPDATE_ALARM = 'update-filters';
const UPDATE_PERIOD_MINUTES = 360; // every 6 hours

// Basic shape validation so a malformed/partial file can never break blocking.
function isValidFilters(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.version === 'number' &&
    data.search &&
    Array.isArray(data.search.removeSelectors) &&
    Array.isArray(data.search.labels) &&
    data.gmail &&
    Array.isArray(data.gmail.adBadges)
  );
}

async function updateFilters() {
  try {
    const res = await fetch(FILTERS_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!isValidFilters(data)) throw new Error('invalid filter file shape');

    const stored = await chrome.storage.local.get('filters');
    // Only overwrite if the remote list is newer (or we have nothing yet).
    if (!stored.filters || (data.version || 0) >= (stored.filters.version || 0)) {
      await chrome.storage.local.set({
        filters: data,
        filtersUpdatedAt: Date.now(),
      });
      console.log('[Ad Blocker] filter list updated to version', data.version);
    }
  } catch (e) {
    console.warn('[Ad Blocker] filter update failed:', e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  updateFilters();
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: UPDATE_PERIOD_MINUTES });
});

chrome.runtime.onStartup.addListener(updateFilters);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM) updateFilters();
});

// Allow a content script to request an on-demand refresh.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'refreshFilters') {
    updateFilters().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
});
