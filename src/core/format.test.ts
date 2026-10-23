import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';
import { formatValue, fullValue } from './format';

const NS = ' ';

describe('formatValue', () => {
  it('показує точні значення без зайвих нулів', () => {
    expect(formatValue('0.3', 10)).toMatchObject({ plain: '0.3', rounded: false, scientific: false });
    expect(formatValue('42', 10)).toMatchObject({ plain: '42', display: '42', rounded: false });
    expect(formatValue('0', 10)).toMatchObject({ plain: '0', rounded: false });
  });

  it('округлює до налаштованої кількості знаків і позначає це', () => {
    const third = evaluate('1 ÷ 3');
    expect(formatValue(third.value, 10, third.inexact)).toMatchObject({ plain: '0.3333333333', rounded: true });
    expect(formatValue('2.5', 0)).toMatchObject({ plain: '3', rounded: true });
    expect(formatValue('2.125', 2)).toMatchObject({ plain: '2.13', rounded: true });
    expect(formatValue('-2.125', 2)).toMatchObject({ plain: '-2.13', rounded: true });
  });

  it('вважає результат неточним, якщо його округлено до робочої точності', () => {
    expect(formatValue('0.5', 10, true).rounded).toBe(true);
  });

  it('розділяє розряди великих чисел лише для показу', () => {
    expect(formatValue('1234567.5', 10)).toMatchObject({ plain: '1234567.5', display: `1${NS}234${NS}567.5` });
    expect(formatValue('-98765', 10).display).toBe(`-98${NS}765`);
    expect(formatValue('1234', 10).display).toBe('1234');
  });

  it('не перетворює малі числа на нуль', () => {
    expect(formatValue('2e-24', 10)).toMatchObject({ plain: '2e-24', display: '2 × 10⁻²⁴', rounded: false, scientific: true });
    expect(formatValue('1.23456789e-15', 3)).toMatchObject({ plain: '1.235e-15', rounded: true });
    expect(formatValue('0.00012', 2)).toMatchObject({ plain: '1.2e-4', rounded: false });
    expect(formatValue('0.0012', 10)).toMatchObject({ plain: '0.0012', scientific: false });
  });

  it('показує дуже великі числа в експоненційному записі', () => {
    expect(formatValue('1e25', 10)).toMatchObject({ plain: '1e+25', display: '1 × 10²⁵', rounded: false });
  });

  it('видає значення, яке калькулятор знову розуміє', () => {
    for (const input of ['2e-24', '1e25', '1234567.5', '-0.75']) {
      const { plain } = formatValue(input, 10);
      expect(evaluate(plain).value.eq(input)).toBe(true);
    }
  });
});

describe('fullValue', () => {
  it('повертає збережене значення без округлення', () => {
    expect(fullValue(evaluate('1 ÷ 3').value)).toBe('0.' + '3'.repeat(50));
    expect(fullValue('2e-24')).toBe('0.000000000000000000000002');
    expect(fullValue('1e-50')).toBe('1e-50');
  });
});
