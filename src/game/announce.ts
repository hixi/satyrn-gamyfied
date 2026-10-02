/** Screen-reader narration: writes to the page's aria-live region when present. */

export function announce(text: string): void {
  if (typeof document === 'undefined') return;
  const live = document.getElementById('satyrn-live');
  if (live) live.textContent = text;
}
