import { Fragment, useMemo, useState } from 'react';
import type { Entry } from '../core/entry';
import { filterEntries } from '../core/search';
import { HistoryItem, type HistoryItemActions } from './HistoryItem';

interface Props extends HistoryItemActions {
  entries: Entry[];
  loading: boolean;
  decimals: number;
  editingId: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onClearAll: () => void;
}

const PAGE = 100;
const dayFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

function dayLabel(timestamp: number): string {
  const day = new Date(timestamp).toDateString();
  const today = new Date();
  if (day === today.toDateString()) return 'Сьогодні';
  today.setDate(today.getDate() - 1);
  if (day === today.toDateString()) return 'Учора';
  return dayFormat.format(timestamp);
}

export function HistoryPanel({ entries, loading, decimals, editingId, query, onQueryChange, onClearAll, ...actions }: Props) {
  const [limit, setLimit] = useState(PAGE);
  const filtered = useMemo(() => filterEntries(entries, query), [entries, query]);
  const visible = filtered.slice(0, limit);

  return (
    <section className="history" aria-labelledby="history-title">
      <div className="history-head">
        <h2 id="history-title">
          Історія {entries.length > 0 && <span className="count">{entries.length}</span>}
        </h2>
        {entries.length > 0 && (
          <button type="button" className="link danger" onClick={onClearAll}>
            Очистити
          </button>
        )}
      </div>

      <input
        type="search"
        className="search"
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setLimit(PAGE);
        }}
        placeholder="Пошук: вираз, результат, назва, #мітка"
        aria-label="Пошук в історії"
      />
      {query.trim() && entries.length > 0 && (
        <p className="search-info">
          Знайдено: {filtered.length}{' '}
          <button type="button" className="link" onClick={() => onQueryChange('')}>
            скинути
          </button>
        </p>
      )}

      {loading ? (
        <p className="empty">Завантаження історії…</p>
      ) : entries.length === 0 ? (
        <p className="empty">Тут з’являтимуться ваші обчислення. Кожне зберігається автоматично, навіть після закриття застосунку.</p>
      ) : filtered.length === 0 ? (
        <p className="empty">Нічого не знайдено.</p>
      ) : (
        <div className="entries">
          {visible.map((entry, i) => {
            const day = dayLabel(entry.createdAt);
            const newDay = i === 0 || dayLabel(visible[i - 1].createdAt) !== day;
            return (
              <Fragment key={entry.id}>
                {newDay && <h3 className="day">{day}</h3>}
                <HistoryItem entry={entry} decimals={decimals} editing={entry.id === editingId} {...actions} />
              </Fragment>
            );
          })}
          {filtered.length > limit && (
            <button type="button" className="button more" onClick={() => setLimit((n) => n + PAGE)}>
              Показати ще ({filtered.length - limit})
            </button>
          )}
        </div>
      )}
    </section>
  );
}
