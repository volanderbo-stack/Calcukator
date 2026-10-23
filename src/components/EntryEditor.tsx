import { useState } from 'react';
import { parseTags, type Entry, type EntryDetails } from '../core/entry';

interface Props {
  entry: Entry;
  onSave: (id: string, details: EntryDetails) => void;
  onCancel: () => void;
}

export function EntryEditor({ entry, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(entry.title);
  const [tags, setTags] = useState(entry.tags.join(', '));
  const [note, setNote] = useState(entry.note);

  return (
    <form
      className="editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(entry.id, { title: title.trim(), tags: parseTags(tags), note: note.trim() });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) e.currentTarget.requestSubmit();
      }}
    >
      <label>
        Назва
        <input autoFocus value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Наприклад, фарба для кухні" />
      </label>
      <label>
        Мітки
        <input value={tags} maxLength={200} onChange={(e) => setTags(e.target.value)} placeholder="Через кому: ремонт, кухня" />
      </label>
      <label>
        Примітка
        <textarea value={note} rows={2} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Для чого цей розрахунок" />
      </label>
      <div className="editor-actions">
        <button type="submit" className="button primary">
          Зберегти
        </button>
        <button type="button" className="button" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  );
}
