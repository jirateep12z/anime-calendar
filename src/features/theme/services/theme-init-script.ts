import { THEME_STORAGE_KEY } from '../constants/storage-keys';
import { THEME_MODES } from '../constants/theme-modes';

export const THEME_INIT_SCRIPT = `(function () {
  var theme = 'system';
  try {
    var stored_state = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}));
    if (stored_state && ${JSON.stringify(THEME_MODES)}.indexOf(stored_state.theme) !== -1) {
      theme = stored_state.theme;
    }
  } catch (_error) {}
  try {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (_error) {}
})();`;
