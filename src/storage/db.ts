import type { Entry } from '../core/entry';

const DB_NAME = 'smart-calculator';
const STORE = 'entries';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступна'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    // Дозволяємо наступну спробу відкрити базу.
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

async function write(work: (store: IDBObjectStore) => void): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    work(tx.objectStore(STORE));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Усі записи, новіші зверху. */
export async function loadEntries(): Promise<Entry[]> {
  const db = await openDb();
  const entries = await new Promise<Entry[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as Entry[]);
    request.onerror = () => reject(request.error);
  });
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export function saveEntries(entries: Entry[]): Promise<void> {
  return write((store) => entries.forEach((entry) => store.put(entry)));
}

export function deleteEntries(ids: string[]): Promise<void> {
  return write((store) => ids.forEach((id) => store.delete(id)));
}

/** Просимо браузер не очищати сховище автоматично, коли бракує місця. */
export function requestPersistentStorage(): void {
  navigator.storage?.persist?.().catch(() => {});
}
