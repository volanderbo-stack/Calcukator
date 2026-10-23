import type { Entry } from './entry';

// Різні записи одного оператора: «*» і «×», «/» і «÷», «-» і «−», кома й крапка.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[×·]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/,/g, '.');
}

function haystack(entry: Entry): string {
  return normalize(
    [entry.title, entry.note, entry.expression, entry.expression.replace(/\s+/g, ''), entry.result, entry.tags.join(' ')].join('\n'),
  );
}

/**
 * Усі слова запиту мають знайтися в записі. Слово з «#» шукається лише серед міток
 * (за початком мітки): «#рем» знайде «ремонт».
 */
export function filterEntries(entries: Entry[], query: string): Entry[] {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries;
  return entries.filter((entry) => {
    const text = haystack(entry);
    return words.every((word) => {
      if (word.startsWith('#') && word.length > 1) {
        const prefix = word.slice(1).toLowerCase();
        return entry.tags.some((tag) => tag.toLowerCase().startsWith(prefix));
      }
      return text.includes(normalize(word));
    });
  });
}
