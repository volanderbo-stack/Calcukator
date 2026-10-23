import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';

const value = (input: string) => evaluate(input).value.toString();

describe('evaluate: десяткові дроби', () => {
  it('рахує без похибок плаваючої коми', () => {
    expect(value('0.1 + 0.2')).toBe('0.3');
    expect(value('0.3 − 0.1')).toBe('0.2');
    expect(value('1.1 × 1.1')).toBe('1.21');
    expect(value('0.07 × 100')).toBe('7');
    expect(evaluate('0.1 + 0.2').inexact).toBe(false);
  });

  it('приймає кому як десятковий роздільник', () => {
    expect(value('1,5 + 1,25')).toBe('2.75');
  });

  it('працює з дуже малими числами', () => {
    expect(value('0.000000000001 × 0.000000000002')).toBe('2e-24');
    expect(value('1e-20 + 1e-20')).toBe('2e-20');
    expect(value('1e-30 ÷ 4')).toBe('2.5e-31');
    expect(value('1 + 1e-40')).toBe('1.' + '0'.repeat(39) + '1');
  });

  it('позначає результат, який не вміщується в точність', () => {
    const third = evaluate('1 ÷ 3');
    expect(third.inexact).toBe(true);
    expect(third.value.toString()).toBe('0.' + '3'.repeat(50));
    expect(evaluate('10 ÷ 4')).toMatchObject({ inexact: false });
    expect(value('10 ÷ 4')).toBe('2.5');
  });

  it('не повертає «−0»', () => {
    expect(value('0 × -1')).toBe('0');
  });
});

describe('evaluate: оператори', () => {
  it('дотримується пріоритету та дужок', () => {
    expect(value('2 + 3 × 4')).toBe('14');
    expect(value('(2 + 3) × 4')).toBe('20');
    expect(value('2 × (3 + (4 − 1))')).toBe('12');
    expect(value('10 − 4 − 3')).toBe('3');
    expect(value('100 ÷ 10 ÷ 5')).toBe('2');
  });

  it('підтримує унарний мінус', () => {
    expect(value('-2 × 3')).toBe('-6');
    expect(value('2 × -3')).toBe('-6');
    expect(value('--2')).toBe('2');
    expect(value('-(2 + 3)')).toBe('-5');
  });

  it('приймає ASCII- та Unicode-оператори', () => {
    expect(value('6*7')).toBe('42');
    expect(value('6·7')).toBe('42');
    expect(value('84/2')).toBe('42');
    expect(value('84:2')).toBe('42');
    expect(value('50-8')).toBe('42');
  });

  it('рахує відсотки як звичайний калькулятор', () => {
    expect(value('50%')).toBe('0.5');
    expect(value('200 + 10%')).toBe('220');
    expect(value('200 − 10%')).toBe('180');
    expect(value('200 × 10%')).toBe('20');
    expect(value('200 ÷ 10%')).toBe('2000');
    expect(value('1500 + 2.5%')).toBe('1537.5');
  });
});

describe('evaluate: помилки', () => {
  const error = (input: string) => {
    try {
      evaluate(input);
    } catch (e) {
      return (e as Error).message;
    }
    throw new Error(`«${input}» мав викликати помилку`);
  };

  it('пояснює некоректне введення зрозумілою мовою', () => {
    expect(error('')).toBe('Введіть вираз');
    expect(error('   ')).toBe('Введіть вираз');
    expect(error('1 ÷ 0')).toBe('Ділення на нуль неможливе');
    expect(error('5 ÷ (2 − 2)')).toBe('Ділення на нуль неможливе');
    expect(error('2 +')).toMatch(/обірвано/);
    expect(error('(2 + 3')).toBe('Не закрито дужку');
    expect(error('2 + 3)')).toBe('Зайва закриваюча дужка');
    expect(error('()')).toMatch(/Порожні дужки/);
    expect(error('2 3')).toBe('Бракує оператора між числами');
    expect(error('1.2.3')).toMatch(/десяткового роздільника/);
    expect(error('2 + abc')).toBe('Невідомий символ «a»');
    expect(error('2 × × 3')).toBe('Два оператори поспіль');
    expect(error('% 5')).toMatch(/після числа/);
  });
});
