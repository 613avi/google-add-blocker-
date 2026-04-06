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

function removeAds() {
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

// Run immediately and observe for dynamic content
removeAds();
const observer = new MutationObserver(removeAds);
observer.observe(document.documentElement, { childList: true, subtree: true });

// Also run after full load
window.addEventListener('load', removeAds);
