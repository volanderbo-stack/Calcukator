import { describe, expect, it } from 'vitest';
import { createEntry, parseTags, type Entry } from './entry';
import { filterEntries } from './search';

function entry(expression: string, result: string, details: Partial<Entry> = {}): Entry {
  return { ...createEntry(expression, result, false), ...details };
}

const paint = entry('12.5 × 3', '37.5', { title: 'Фарба для кухні', tags: ['ремонт', 'кухня'], note: 'Два шари' });
const salary = entry('42000 − 18%', '34440', { title: 'Зарплата', tags: ['гроші'] });
const plain = entry('7 ÷ 2', '3.5');
const all = [paint, salary, plain];

describe('parseTags', () => {
  it('розбиває за комами, прибирає «#», пробіли та повтори', () => {
    expect(parseTags('#Ремонт, фарба,  ремонт , ,##кухня')).toEqual(['Ремонт', 'фарба', 'кухня']);
    expect(parseTags('')).toEqual([]);
  });
});

describe('filterEntries', () => {
  it('повертає все для порожнього запиту', () => {
    expect(filterEntries(all, '  ')).toEqual(all);
  });

  it('шукає за назвою, приміткою, результатом і без урахування регістру', () => {
    expect(filterEntries(all, 'фарба')).toEqual([paint]);
    expect(filterEntries(all, 'ШАРИ')).toEqual([paint]);
    expect(filterEntries(all, '34440')).toEqual([salary]);
  });

  it('шукає у виразі незалежно від запису оператора та пробілів', () => {
    expect(filterEntries(all, '12.5*3')).toEqual([paint]);
    expect(filterEntries(all, '7/2')).toEqual([plain]);
    expect(filterEntries(all, '42000-18%')).toEqual([salary]);
    expect(filterEntries(all, '12,5')).toEqual([paint]);
  });

  it('«#мітка» шукає лише серед міток, за початком', () => {
    expect(filterEntries(all, '#рем')).toEqual([paint]);
    expect(filterEntries(all, '#фарба')).toEqual([]);
  });

  it('вимагає збігу всіх слів', () => {
    expect(filterEntries(all, 'кухні #ремонт')).toEqual([paint]);
    expect(filterEntries(all, 'кухні гроші')).toEqual([]);
  });
});
