import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Entry } from '../core/entry';
import { CalcError, evaluate, tryEvaluate, type Evaluation } from '../core/evaluate';
import { formatValue, fullValue, type Formatted } from '../core/format';
import { ResultValue } from './ResultValue';

interface Props {
  decimals: number;
  reopen: { expression: string; nonce: number } | null;
  onCompute: (expression: string, evaluation: Evaluation) => Entry;
  onEditEntry: (id: string) => void;
  onCopy: (text: string, what: string) => void;
}

type Outcome = { kind: 'result'; entry: Entry } | { kind: 'error'; message: string };

type Key = { label: string; insert: string; className?: string } | { label: string; action: 'clear' | 'backspace'; ariaLabel: string };

const KEYS: Key[] = [
  { label: 'C', action: 'clear', ariaLabel: 'Очистити' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '⌫', action: 'backspace', ariaLabel: 'Стерти символ' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '÷', insert: ' ÷ ', className: 'key-op' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '×', insert: ' × ', className: 'key-op' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '−', insert: ' − ', className: 'key-op' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
  { label: '%', insert: '%', className: 'key-op' },
  { label: '+', insert: ' + ', className: 'key-op' },
];

// На сенсорних екранах не відкриваємо системну клавіатуру: є власна.
const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;

export function Calculator({ decimals, reopen, onCompute, onEditEntry, onCopy }: Props) {
  const [expr, setExpr] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = caretRef.current;
    if (!input || caret === null) return;
    caretRef.current = null;
    if (finePointer) input.focus();
    if (document.activeElement === input) input.setSelectionRange(caret, caret);
  });

  function update(next: string, caret = next.length) {
    setExpr(next);
    setOutcome(null);
    caretRef.current = caret;
  }

  useEffect(() => {
    if (reopen) update(reopen.expression);
  }, [reopen]);

  const preview = useMemo(() => {
    if (outcome || !expr.trim()) return null;
    const evaluation = tryEvaluate(expr);
    if (!evaluation) return null;
    const formatted = formatValue(evaluation.value, decimals, evaluation.inexact);
    // Для одного числа попередній перегляд нічого не додає.
    return formatted.plain === expr.trim() ? null : formatted;
  }, [expr, outcome, decimals]);

  // Після «=» вираз лишається в полі: нове введення просто дописується до нього.
  function insert(text: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? expr.length;
    const end = input?.selectionEnd ?? expr.length;
    update(expr.slice(0, start) + text + expr.slice(end), start + text.length);
  }

  function backspace() {
    const input = inputRef.current;
    const start = input?.selectionStart ?? expr.length;
    const end = input?.selectionEnd ?? expr.length;
    if (start !== end) {
      update(expr.slice(0, start) + expr.slice(end), start);
      return;
    }
    // Оператор разом з пробілами довкола стирається одним натисканням.
    const before = expr.slice(0, start).replace(/\s*\S\s*$/, '');
    update(before + expr.slice(start), before.length);
  }

  function clear() {
    update('');
  }

  function compute() {
    const expression = expr.trim();
    try {
      setOutcome({ kind: 'result', entry: onCompute(expression, evaluate(expression)) });
    } catch (e) {
      if (!(e instanceof CalcError)) throw e;
      setOutcome({ kind: 'error', message: e.message });
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      compute();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clear();
    }
  }

  return (
    <section className="calculator" aria-label="Калькулятор">
      <div className={outcome?.kind === 'error' ? 'display has-error' : 'display'}>
        <input
          ref={inputRef}
          className="expression"
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            setOutcome(null);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Вираз"
          inputMode={finePointer ? 'text' : 'none'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="output" aria-live="polite">
          {outcome?.kind === 'error' && <p className="error">{outcome.message}</p>}
          {outcome?.kind === 'result' && (
            <Result key={outcome.entry.id} entry={outcome.entry} decimals={decimals} onEdit={onEditEntry} onCopy={onCopy} />
          )}
          {preview && (
            <p className="preview">
              <ResultValue formatted={preview} />
            </p>
          )}
        </div>
      </div>

      <div className="keypad">
        {KEYS.map((key) =>
          'action' in key ? (
            <button
              key={key.label}
              type="button"
              className="key key-fn"
              aria-label={key.ariaLabel}
              onClick={key.action === 'clear' ? clear : backspace}
            >
              {key.label}
            </button>
          ) : (
            <button key={key.label} type="button" className={`key ${key.className ?? ''}`} onClick={() => insert(key.insert)}>
              {key.label}
            </button>
          ),
        )}
        <button type="button" className="key key-equals" onClick={compute}>
          =
        </button>
      </div>
    </section>
  );
}

function precisionNote(formatted: Formatted, decimals: number): string {
  if (!formatted.rounded) return 'Точне значення';
  if (formatted.scientific) return `Округлено до ${decimals + 1} значущих цифр`;
  if (decimals === 0) return 'Округлено до цілого';
  return `Округлено до ${decimals} ${decimals % 10 === 1 && decimals % 100 !== 11 ? 'знака' : 'знаків'} після коми`;
}

interface ResultProps {
  entry: Entry;
  decimals: number;
  onEdit: (id: string) => void;
  onCopy: (text: string, what: string) => void;
}

function Result({ entry, decimals, onEdit, onCopy }: ResultProps) {
  const [showFull, setShowFull] = useState(false);
  const formatted = formatValue(entry.result, decimals, entry.inexact);
  const full = fullValue(entry.result);

  return (
    <div className="result">
      <p className="result-main">
        <ResultValue formatted={formatted} />
      </p>
      <p className="precision">
        {precisionNote(formatted, decimals)}
        {formatted.rounded && (
          <>
            {' · '}
            <button type="button" className="link" onClick={() => setShowFull((v) => !v)} aria-expanded={showFull}>
              {showFull ? 'сховати повне значення' : 'показати повне значення'}
            </button>
          </>
        )}
      </p>
      {showFull && (
        <div className="full-value">
          <code>{full}</code>
          <p className="hint">
            {entry.inexact
              ? 'Точний результат має нескінченно багато цифр, збережено 50 значущих.'
              : 'Збережене точне значення.'}
          </p>
          <button type="button" className="button small" onClick={() => onCopy(full, 'Повне значення')}>
            Копіювати повне значення
          </button>
        </div>
      )}
      <div className="result-actions">
        <span className="saved">✓ Збережено в історії</span>
        <button type="button" className="button small" onClick={() => onCopy(formatted.plain, 'Результат')}>
          Копіювати
        </button>
        <button type="button" className="button small" onClick={() => onEdit(entry.id)}>
          Назва, мітки, примітка
        </button>
      </div>
    </div>
  );
}
