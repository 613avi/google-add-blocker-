# 🛡️ חוסם פרסומות בגוגל ובג'ימייל | Google & Gmail Ad Blocker

תוסף לכרום שמסיר אוטומטית תוצאות ממומנות ופרסומות מחיפוש גוגל, וגם פרסומות בתוך Gmail.

A Chrome extension that automatically removes sponsored results and ads from Google Search and Gmail.

## ✨ פיצ'רים | Features

- 🚫 הסרת כל התוצאות הממומנות בחיפוש | Removes all sponsored search results
- 📧 חסימת אימיילים ממומנים בלשונית "קידומי מכירות" ב-Gmail | Blocks sponsored emails in the Gmail "Promotions" tab
- 🪧 הסרת הבאנרים הפרסומיים שגוגל הוסיפו ל-Gmail | Removes the promotional banners Google added to Gmail
- 🔄 רשימות חסימה שמתעדכנות אוטומטית מ-GitHub בלי לעדכן את התוסף בחנות | Block lists auto-update from GitHub — no Web Store update needed
- ⚡ מהיר וקל משקל | Fast and lightweight
- 🌐 תמיכה בעברית, אנגלית ושפות נוספות | Multi-language support
- 🔒 לא אוסף מידע | Zero data collection
- 🛡️ לא דורש הרשאות מיוחדות | No special permissions required

## 📥 התקנה | Installation

1. הורד את התוסף מ-[Chrome Web Store](#)
2. או: שכפל מאגר זה, פתח `chrome://extensions/`, הפעל Developer Mode ולחץ Load Unpacked

## 🔄 עדכון רשימות החסימה | Updating the block lists

רשימות החסימה נשמרות בקובץ [`filters.json`](filters.json). התוסף מוריד אותו אוטומטית מ-GitHub (בהתקנה, בהפעלה וכל 6 שעות), כך שאפשר לשפר את החסימה פשוט ע"י עריכת `filters.json` ב-`main` — **בלי לפרסם גרסה חדשה בחנות**.

The block lists live in [`filters.json`](filters.json). The extension fetches it automatically from GitHub (on install, on startup, and every 6 hours), so you can improve blocking just by editing `filters.json` on `main` — **without publishing a new Web Store version**. The bundled lists are used as a fallback if the fetch fails.

> אם פיצלת (fork) את המאגר, עדכן את כתובת ה-URL בראש `background.js` כך שתצביע על ה-fork שלך.
> If you fork the repo, update the URL at the top of `background.js` to point at your fork.

## 🔒 פרטיות | Privacy

התוסף לא אוסף שום מידע. ראו [מדיניות פרטיות](PRIVACY_POLICY.md).

This extension collects no data. See [Privacy Policy](PRIVACY_POLICY.md).

## 📄 רישיון | License

MIT
