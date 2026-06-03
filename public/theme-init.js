/* SwiftBridge — theme FOUC-preventie (UU).
   Zet .dark class op <html> voor React rendert, zodat eerste frame
   al juiste theme heeft. Externe file ivm strict CSP (geen unsafe-inline).
*/
(function () {
  try {
    var keuze = localStorage.getItem('sb_theme') || 'system';
    var isDark =
      keuze === 'dark' ||
      (keuze === 'system' &&
       window.matchMedia &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) { /* silent — page rendert in light mode */ }
})();
