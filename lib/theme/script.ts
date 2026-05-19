/** Script inline para aplicar tema antes del paint (evita flash). */
export const themeInitScript = `
(function () {
  try {
    var key = 'resident-management-theme';
    var stored = localStorage.getItem(key);
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark =
      stored === 'dark' || (stored !== 'light' && (stored === 'system' || !stored) && systemDark);
    var root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) {}
})();
`;
