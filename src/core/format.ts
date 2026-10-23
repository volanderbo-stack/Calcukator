import type Decimal from 'decimal.js';
import { Dec } from './evaluate';

export const DEFAULT_DECIMALS = 10;
export const MAX_DECIMALS = 20;

export interface Formatted {
  /** Значення для копіювання й повторного введення: «1234.5», «1.2e-15». */
  plain: string;
  /** Значення для показу: з розділенням розрядів і «× 10ⁿ». */
  display: string;
  /** Показане значення відрізняється від точного. */
  rounded: boolean;
  /** Показано в експоненційному записі. */
  scientific: boolean;
}

const SMALL = new Dec('1e-6');
const LARGE = new Dec('1e21');
const NARROW_SPACE = ' ';
const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/**
 * Округлює до `decimals` знаків після коми. Дуже малі та дуже великі числа
 * показує в експоненційному записі з `decimals + 1` значущими цифрами,
 * щоб, наприклад, 0.000000000002 не перетворилося на «0».
 */
export function formatValue(input: Decimal.Value, decimals: number, inexact = false): Formatted {
  const value = new Dec(input);
  if (value.isZero()) return { plain: '0', display: '0', rounded: inexact, scientific: false };

  const abs = value.abs();
  const fixed = value.toDecimalPlaces(decimals);
  const scientific = abs.gte(LARGE) || abs.lt(SMALL) || fixed.isZero();
  const shown = scientific ? value.toSignificantDigits(decimals + 1) : fixed;
  const plain = scientific ? shown.toExponential() : shown.toFixed();

  return {
    plain,
    display: scientific ? displayScientific(plain) : groupDigits(plain),
    rounded: inexact || !shown.eq(value),
    scientific,
  };
}

/** Повне збережене значення без округлення до налаштованої кількості знаків. */
export function fullValue(input: Decimal.Value): string {
  const value = new Dec(input);
  const abs = value.abs();
  if (value.isZero() || (abs.gte('1e-30') && abs.lt('1e40'))) return value.toFixed();
  return value.toExponential();
}

export function groupDigits(plain: string): string {
  const [, sign, int, frac] = /^(-?)(\d+)(.*)$/.exec(plain) ?? [];
  if (int === undefined || int.length < 5) return plain;
  return sign + int.replace(/\B(?=(\d{3})+$)/g, NARROW_SPACE) + frac;
}

function displayScientific(plain: string): string {
  const [mantissa, exponent] = plain.split('e');
  const power = exponent.replace('+', '').replace(/./g, (c) => SUPERSCRIPT[c] ?? c);
  return `${mantissa} × 10${power}`;
}
