import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard';
import { Calculator } from './components/Calculator';
import { HistoryPanel } from './components/HistoryPanel';
import { Toast, type ToastMessage } from './components/Toast';
import { createEntry, type Entry, type EntryDetails } from './core/entry';
import type { Evaluation } from './core/evaluate';
import { MAX_DECIMALS } from './core/format';
import { deleteEntries, loadEntries, saveEntries } from './storage/db';
import { loadDecimals, saveDecimals } from './storage/settings';

const byNewest = (a: Entry, b: Entry) => b.createdAt - a.createdAt;

function mergeEntries(current: Entry[], added: Entry[]): Entry[] {
  const ids = new Set(current.map((e) => e.id));
  return [...current, ...added.filter((e) => !ids.has(e.id))].sort(byNewest);
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [decimals, setDecimals] = useState(loadDecimals);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [reopen, setReopen] = useState<{ expression: string; nonce: number } | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    loadEntries()
      .then((stored) => setEntries((current) => mergeEntries(current, stored)))
      .catch(() => setStorageError('Не вдалося відкрити історію. Обчислення працюють, але не збережуться після закриття.'))
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((operation: Promise<void>) => {
    operation.catch(() =>
      setStorageError('Не вдалося зберегти зміни в історії. Перевірте, чи браузер дозволяє цьому сайту зберігати дані.'),
    );
  }, []);

  const showToast = useCallback((message: string, action?: ToastMessage['action']) => {
    setToast({ id: Date.now(), message, action });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const handleCompute = useCallback(
    (expression: string, evaluation: Evaluation): Entry => {
      // Повторне «=» для того самого виразу не дублює запис.
      const latest = entriesRef.current[0];
      if (latest?.expression === expression) return latest;
      const entry = createEntry(expression, evaluation.value.toString(), evaluation.inexact);
      setEntries((current) => [entry, ...current]);
      persist(saveEntries([entry]));
      return entry;
    },
    [persist],
  );

  const handleSave = useCallback(
    (id: string, details: EntryDetails) => {
      const entry = entriesRef.current.find((e) => e.id === id);
      setEditingId(null);
      if (!entry) return;
      const updated: Entry = { ...entry, ...details, updatedAt: Date.now() };
      setEntries((current) => current.map((e) => (e.id === id ? updated : e)));
      persist(saveEntries([updated]));
    },
    [persist],
  );

  const removeEntries = useCallback(
    (removed: Entry[], message: string) => {
      const ids = new Set(removed.map((e) => e.id));
      setEntries((current) => current.filter((e) => !ids.has(e.id)));
      persist(deleteEntries([...ids]));
      showToast(message, {
        label: 'Скасувати',
        run: () => {
          setEntries((current) => mergeEntries(current, removed));
          persist(saveEntries(removed));
          setToast(null);
        },
      });
    },
    [persist, showToast],
  );

  const handleClearAll = useCallback(() => {
    const all = entriesRef.current;
    if (all.length && window.confirm(`Видалити всі записи історії (${all.length})?`)) removeEntries(all, 'Історію очищено');
  }, [removeEntries]);

  const handleEditRequest = useCallback(
    (id: string) => {
      if (!entriesRef.current.some((e) => e.id === id)) {
        showToast('Цей запис уже видалено');
        return;
      }
      setQuery('');
      setEditingId(id);
    },
    [showToast],
  );

  const handleCopy = useCallback(
    (text: string, what: string) => {
      copyText(text).then(
        () => showToast(`${what} скопійовано`),
        () => showToast('Не вдалося скопіювати'),
      );
    },
    [showToast],
  );

  const handleReopen = useCallback((entry: Entry) => {
    setReopen({ expression: entry.expression, nonce: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Розумний калькулятор</h1>
        <label className="decimals">
          Знаків після коми
          <select
            value={decimals}
            onChange={(e) => {
              const value = Number(e.target.value);
              setDecimals(value);
              saveDecimals(value);
            }}
          >
            {Array.from({ length: MAX_DECIMALS + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </header>

      {storageError && (
        <p className="banner" role="alert">
          {storageError}
        </p>
      )}

      <main className="layout">
        <Calculator decimals={decimals} reopen={reopen} onCompute={handleCompute} onEditEntry={handleEditRequest} onCopy={handleCopy} />
        <HistoryPanel
          entries={entries}
          loading={loading}
          decimals={decimals}
          editingId={editingId}
          query={query}
          onQueryChange={setQuery}
          onClearAll={handleClearAll}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onSave={handleSave}
          onDelete={(entry) => removeEntries([entry], 'Запис видалено')}
          onCopy={handleCopy}
          onReopen={handleReopen}
          onTagClick={(tag) => setQuery(`#${tag}`)}
        />
      </main>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
