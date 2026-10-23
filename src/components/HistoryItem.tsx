import { useEffect, useRef } from 'react';
import type { Entry, EntryDetails } from '../core/entry';
import { formatValue } from '../core/format';
import { EntryEditor } from './EntryEditor';
import { ResultValue } from './ResultValue';

export interface HistoryItemActions {
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string, details: EntryDetails) => void;
  onDelete: (entry: Entry) => void;
  onCopy: (text: string, what: string) => void;
  onReopen: (entry: Entry) => void;
  onTagClick: (tag: string) => void;
}

interface Props extends HistoryItemActions {
  entry: Entry;
  decimals: number;
  editing: boolean;
}

const timeFormat = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

export function HistoryItem({ entry, decimals, editing, onStartEdit, onCancelEdit, onSave, onDelete, onCopy, onReopen, onTagClick }: Props) {
  const ref = useRef<HTMLElement>(null);
  const formatted = formatValue(entry.result, decimals, entry.inexact);
  const hasDetails = Boolean(entry.title || entry.note || entry.tags.length);

  useEffect(() => {
    if (editing) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editing]);

  return (
    <article ref={ref} className={editing ? 'entry editing' : 'entry'}>
      <div className="entry-head">
        {entry.title ? <p className="entry-title">{entry.title}</p> : <span />}
        <time dateTime={new Date(entry.createdAt).toISOString()}>{timeFormat.format(entry.createdAt)}</time>
      </div>
      <p className="entry-expression">{entry.expression}</p>
      <p className="entry-result">
        <ResultValue formatted={formatted} />
      </p>
      {entry.tags.length > 0 && (
        <ul className="tags" aria-label="Мітки">
          {entry.tags.map((tag) => (
            <li key={tag}>
              <button type="button" className="tag" onClick={() => onTagClick(tag)} title="Показати записи з цією міткою">
                #{tag}
              </button>
            </li>
          ))}
        </ul>
      )}
      {entry.note && <p className="entry-note">{entry.note}</p>}

      {editing ? (
        <EntryEditor entry={entry} onSave={onSave} onCancel={onCancelEdit} />
      ) : (
        <div className="entry-actions">
          <button type="button" className="button small" onClick={() => onReopen(entry)} title="Відкрити вираз у калькуляторі">
            Відкрити
          </button>
          <button type="button" className="button small" onClick={() => onCopy(formatted.plain, 'Результат')}>
            Копіювати
          </button>
          <button
            type="button"
            className="button small"
            onClick={() => onCopy(`${entry.expression} ${formatted.rounded ? '≈' : '='} ${formatted.plain}`, 'Вираз і результат')}
          >
            Копіювати з виразом
          </button>
          <button type="button" className="button small" onClick={() => onStartEdit(entry.id)}>
            {hasDetails ? 'Змінити' : 'Додати назву'}
          </button>
          <button type="button" className="button small danger" onClick={() => onDelete(entry)}>
            Видалити
          </button>
        </div>
      )}
    </article>
  );
}
