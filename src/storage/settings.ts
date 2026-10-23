import { DEFAULT_DECIMALS, MAX_DECIMALS } from '../core/format';

const DECIMALS_KEY = 'smart-calculator:decimals';

export function loadDecimals(): number {
  try {
    const stored = Number(localStorage.getItem(DECIMALS_KEY));
    if (localStorage.getItem(DECIMALS_KEY) !== null && Number.isInteger(stored) && stored >= 0 && stored <= MAX_DECIMALS) {
      return stored;
    }
  } catch {
    // Сховище недоступне (приватний режим тощо) — працюємо зі значенням за замовчуванням.
  }
  return DEFAULT_DECIMALS;
}

export function saveDecimals(decimals: number): void {
  try {
    localStorage.setItem(DECIMALS_KEY, String(decimals));
  } catch {
    // Налаштування просто не запам'ятається.
  }
}
