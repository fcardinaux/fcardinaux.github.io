// The light/dark switch in the header: shows the mode it switches to.
// The remembered choice is applied in <head>, before the first paint.
const root = document.documentElement;
const themeButton = document.getElementById('theme');
const isDark = () => root.dataset.theme
  ? root.dataset.theme === 'dark'
  : !matchMedia('(prefers-color-scheme: light)').matches;
const label = () => { themeButton.textContent = isDark() ? 'Light mode' : 'Dark mode'; };
themeButton.addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  label();
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', label);
label();
