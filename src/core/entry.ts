export interface Entry {
  id: string;
  expression: string;
  /** Точний результат у записі decimal.js (Decimal#toString). */
  result: string;
  /** Результат довелося округлити до робочої точності (50 значущих цифр). */
  inexact: boolean;
  title: string;
  tags: string[];
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type EntryDetails = Pick<Entry, 'title' | 'tags' | 'note'>;

export function createEntry(expression: string, result: string, inexact: boolean): Entry {
  const now = Date.now();
  return { id: newId(), expression, result, inexact, title: '', tags: [], note: '', createdAt: now, updatedAt: now };
}

/** «#Ремонт, фарба, ремонт» → ['Ремонт', 'фарба']. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(',')) {
    const tag = raw.trim().replace(/^#+/, '').trim();
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
