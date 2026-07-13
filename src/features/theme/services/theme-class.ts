export function ApplyThemeClass(theme: string) {
  if (typeof window === 'undefined') return;
  if (theme === 'system') {
    const prefers_dark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    if (prefers_dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
