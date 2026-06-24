// ===========================================================================
// Ad-filter lists
//
// These bundled DEFAULT_FILTERS are the fallback. The background service worker
// fetches an up-to-date filters.json from GitHub and stores it in
// chrome.storage.local, so the lists below can be improved remotely WITHOUT
// publishing a new version to the Chrome Web Store.
// ===========================================================================

const DEFAULT_FILTERS = {
  version: 3,
  search: {
    removeSelectors: [
      '#tads',                    // Top ads container
      '#bottomads',               // Bottom ads container
      '.ads-ad',                  // Individual ads
      '[data-text-ad]',           // Text ads
      '#tvcap',                   // Top video/commercial ads
      '.commercial-unit-desktop-top', // Shopping ads top
      '.commercial-unit-desktop-rhs', // Shopping ads sidebar
      '.cu-container',            // Commercial unit container
      '[aria-label="Ads"]',       // Aria-labeled ad sections
      '.mnr-c.pla-unit',          // Product listing ads
      '.pla-hovercard-content-ellip', // PLA hover cards
      'div[data-hveid] > div[data-text-ad]',
    ],
    cssSelectors: [
      '#tads', '#bottomads', '.ads-ad', '[data-text-ad]', '#tvcap',
      '.commercial-unit-desktop-top', '.commercial-unit-desktop-rhs',
      '.cu-container', '[aria-label="Ads"]', '[aria-label="תוצאות ממומנות"]',
      '.mnr-c.pla-unit', '.pla-hovercard-content-ellip', '#rhs .ads-ad',
      '.sh-sr__shop-result-group', '[data-ad-client]', '[data-adsbygoogle-status]',
    ],
    labels: [
      'Sponsored', 'Ad', 'Ads', 'ממומן', 'תוצאות ממומנות',
      'Sponsored results', 'הסתרת תוצאות ממומנות',
      'Résultats sponsorisés', 'Gesponserte Ergebnisse', 'Resultados patrocinados',
    ],
  },
  gmail: {
    adBadges: ['Ad', 'Ads', 'ממומן', 'Sponsored', 'מודעה'],
    rowAdSelectors: ['.aZo', '.bGI', '.azt'],
    bannerSelectors: [
      '.bG3', '.aJ6', '.bGI .bG6',
      'div.nH.GZcuQ', '.HZB3Gf', 'span.r6yEfb', // bottom "Ad · Google Workspace" banner
      'div[role="region"][aria-label*="promo" i]',
      'div[aria-label*="קידום" i]',
    ],
    cssSelectors: [
      'tr.zA.byd', 'tr.zA[data-promo]', 'tr.zA:has(.aZo)', '.aZo', '.bGI .azt',
      '.bG3', '.aJ6', 'div.nH.GZcuQ', '.HZB3Gf', 'span.r6yEfb',
      'div[role="region"][aria-label*="promo" i]',
      'div[aria-label*="קידום" i]',
    ],
  },
};

// Live filter set — starts with the bundled defaults, replaced once the remote
// list is loaded from chrome.storage.local.
let FILTERS = DEFAULT_FILTERS;

// ===========================================================================
// Google Search ad blocking
// ===========================================================================

function removeSearchAds() {
  const { removeSelectors, labels } = FILTERS.search;

  for (const selector of removeSelectors) {
    document.querySelectorAll(selector).forEach(el => el.remove());
  }

  // Remove any element containing ad-related text labels
  const allEls = document.querySelectorAll('span, div, h2, button');
  allEls.forEach(el => {
    const text = el.textContent.trim();
    for (const label of labels) {
      if (text === label) {
        // Walk up to find a meaningful container to remove
        let target = el.closest('[data-text-ad], .uEierd, .CnP9N, .v5yQqb, .pla-unit, .commercial-unit-desktop-top')
                  || el.closest('div[data-hveid]');
        // For "תוצאות ממומנות" section — walk up further to get the whole block
        if (!target) {
          let parent = el.parentElement;
          for (let i = 0; i < 8 && parent; i++) {
            // Look for a container that has the sponsored heading + ad results
            if (parent.querySelector &&
                (parent.querySelector('[data-text-ad]') ||
                 parent.querySelectorAll('a[data-rw]').length > 0 ||
                 parent.innerHTML.includes('ממומן'))) {
              target = parent;
            }
            parent = parent.parentElement;
          }
        }
        if (!target) target = el.closest('div');
        if (target) target.remove();
        return;
      }
    }
  });
}

// ===========================================================================
// Gmail ad blocking (sponsored "Promotions" emails + injected banners)
// ===========================================================================

function isGmailAdBadge(el) {
  // A badge is a small leaf element whose entire text is exactly an ad word,
  // so we never match subject lines that merely contain the word "Ad".
  if (el.children.length !== 0) return false;
  const text = el.textContent.trim();
  return FILTERS.gmail.adBadges.includes(text);
}

function removeGmailAds() {
  const { rowAdSelectors, bannerSelectors } = FILTERS.gmail;

  // --- 1) Sponsored email rows (top of "Promotions"/"Social" tabs) ---
  // Ad rows in the thread list carry the 'byd' class and/or an "Ad"/"ממומן"
  // badge (historically the '.aZo' element). Remove the whole <tr> row.
  document.querySelectorAll('tr.zA').forEach(row => {
    const isAd =
      row.classList.contains('byd') ||                 // explicit ad row class
      rowAdSelectors.some(sel => row.querySelector(sel)) || // ad badge/grouping
      row.hasAttribute('data-promo') ||                 // promo attribute
      [...row.querySelectorAll('span, div, b')].some(isGmailAdBadge);
    if (isAd) row.remove();
  });

  // The grouping element that holds the sponsored rows in the Promotions tab.
  rowAdSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const row = el.closest('tr.zA');
      if (row) row.remove();
    });
  });

  // --- 2) Promotional banners Google injects into Gmail ---
  // Top-of-inbox promo banner containers (feature/Gemini/Meet promos).
  bannerSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Generic fallback: any standalone ad badge sitting in a banner-like card
  // that is NOT inside a real email row gets its card removed.
  document.querySelectorAll('span, div, b').forEach(el => {
    if (!isGmailAdBadge(el)) return;
    if (el.closest('tr.zA')) return; // already handled as a list row above
    const card = el.closest('[role="listitem"], [role="region"], .bGI, .nH > div');
    if (card) card.remove();
  });
}

// ===========================================================================
// Dynamic CSS injection (instant hiding using the live — possibly remote — list)
// ===========================================================================

function injectDynamicCss() {
  const selectors = IS_GMAIL ? FILTERS.gmail.cssSelectors : FILTERS.search.cssSelectors;
  if (!selectors || !selectors.length) return;

  let style = document.getElementById('gab-dynamic-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'gab-dynamic-style';
    (document.head || document.documentElement).appendChild(style);
  }
  style.textContent = selectors.join(',\n') + ' { display: none !important; }';
}

// ===========================================================================
// Dispatch + observers + remote filter loading
// ===========================================================================

const IS_GMAIL = /(^|\.)mail\.google\.com$/.test(location.hostname);

function removeAds() {
  if (IS_GMAIL) {
    removeGmailAds();
  } else {
    removeSearchAds();
  }
}

// Load the latest remotely-fetched filter list (falls back to bundled defaults).
function loadStoredFilters() {
  try {
    chrome.storage.local.get('filters', ({ filters }) => {
      if (chrome.runtime.lastError) return;
      if (filters && filters.search && filters.gmail) {
        FILTERS = filters;
        injectDynamicCss();
        removeAds();
      }
    });
    // Live-update if the background worker refreshes the list while open.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.filters && changes.filters.newValue) {
        FILTERS = changes.filters.newValue;
        injectDynamicCss();
        removeAds();
      }
    });
  } catch (e) {
    // chrome.storage unavailable — keep using bundled defaults.
  }
}

// Run immediately with bundled defaults, then upgrade to the remote list.
injectDynamicCss();
removeAds();
loadStoredFilters();

const observer = new MutationObserver(removeAds);
observer.observe(document.documentElement, { childList: true, subtree: true });

// Also run after full load
window.addEventListener('load', removeAds);
