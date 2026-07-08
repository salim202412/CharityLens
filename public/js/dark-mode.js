
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const root = document.documentElement;

  const updateIcon = (theme) => {
    toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  };

  // Reflect current state on load (in case the inline head snippet already set it)
  updateIcon(root.getAttribute('data-theme') || 'light');

  toggleBtn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';

    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateIcon(next);
  });
});
