import { DEFAULT_DECIMALS, MAX_DECIMALS } from '../core/format';

const DECIMALS_KEY = 'smart-calculator:decimals';
const DRAFT_KEY = 'smart-calculator:draft';

/** Вміст поля виразу, щоб після закриття застосунку продовжити з того самого місця. */
export function loadDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveDraft(expression: string): void {
  try {
    if (expression) localStorage.setItem(DRAFT_KEY, expression);
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Поле просто не відновиться після закриття.
  }
}

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
