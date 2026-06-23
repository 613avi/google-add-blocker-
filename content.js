// ===========================================================================
// Google Search ad blocking
// ===========================================================================

// Selectors for Google Search ad elements
const AD_SELECTORS = [
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
];

const AD_LABELS = [
  'Sponsored', 'Ad', 'Ads', 'ממומן', 'תוצאות ממומנות',
  'Sponsored results', 'הסתרת תוצאות ממומנות',
  'Résultats sponsorisés', 'Gesponserte Ergebnisse', 'Resultados patrocinados'
];

function removeSearchAds() {
  for (const selector of AD_SELECTORS) {
    document.querySelectorAll(selector).forEach(el => el.remove());
  }

  // Remove any element containing ad-related text labels
  const allEls = document.querySelectorAll('span, div, h2, button');
  allEls.forEach(el => {
    const text = el.textContent.trim();
    for (const label of AD_LABELS) {
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

// Exact badge texts that mark a sponsored email in the message list.
const GMAIL_AD_BADGES = ['Ad', 'Ads', 'ממומן', 'Sponsored', 'מודעה'];

function isGmailAdBadge(el) {
  // A badge is a small leaf element whose entire text is exactly an ad word,
  // so we never match subject lines that merely contain the word "Ad".
  if (el.children.length !== 0) return false;
  const text = el.textContent.trim();
  return GMAIL_AD_BADGES.includes(text);
}

function removeGmailAds() {
  // --- 1) Sponsored email rows (top of "Promotions"/"Social" tabs) ---
  // Ad rows in the thread list carry the 'byd' class and/or an "Ad"/"ממומן"
  // badge (historically the '.aZo' element). Remove the whole <tr> row.
  document.querySelectorAll('tr.zA').forEach(row => {
    const isAd =
      row.classList.contains('byd') ||                 // explicit ad row class
      row.querySelector('.aZo') ||                      // ad badge element
      row.hasAttribute('data-promo') ||                 // promo attribute
      [...row.querySelectorAll('span, div, b')].some(isGmailAdBadge);
    if (isAd) row.remove();
  });

  // The list container that groups the sponsored rows in the Promotions tab.
  document.querySelectorAll('.bGI, .azt, .aZo').forEach(el => {
    const row = el.closest('tr.zA');
    if (row) row.remove();
    else el.remove();
  });

  // --- 2) Promotional banners Google injects into Gmail ---
  // These appear at the top of the inbox / above the thread list. They are
  // marked with a "Promotions"/feature-promo badge or carry a close button
  // labelled "Dismiss". Detect by their ad badge text and remove the banner.

  // Known top-of-inbox promo banner containers (feature/Gemini/Meet promos).
  const BANNER_SELECTORS = [
    '.bG3',          // promo banner wrapper
    '.aJ6',          // top promotional strip
    '.bGI .bG6',     // promotion card inside list
    'div[role="region"][aria-label*="promo" i]',
    'div[aria-label*="קידום" i]',
  ];
  BANNER_SELECTORS.forEach(sel => {
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
// Dispatch + observers
// ===========================================================================

const IS_GMAIL = /(^|\.)mail\.google\.com$/.test(location.hostname);

function removeAds() {
  if (IS_GMAIL) {
    removeGmailAds();
  } else {
    removeSearchAds();
  }
}

// Run immediately and observe for dynamic content
removeAds();
const observer = new MutationObserver(removeAds);
observer.observe(document.documentElement, { childList: true, subtree: true });

// Also run after full load
window.addEventListener('load', removeAds);
