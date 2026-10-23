import Decimal from 'decimal.js';

/** Робоча точність: 50 значущих цифр, десяткова арифметика без похибок двійкової плаваючої коми. */
export const Dec = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

// Високоточна копія, щоб помітити, коли результат довелося округлити до робочої точності.
const Exact = Decimal.clone({ precision: 1000, rounding: Decimal.ROUND_HALF_UP });

export class CalcError extends Error {
  constructor(
    message: string,
    readonly position?: number,
  ) {
    super(message);
    this.name = 'CalcError';
  }
}

export interface Evaluation {
  value: Decimal;
  /** Результат не вміщується в робочу точність (наприклад, 1 ÷ 3) і збережений округленим. */
  inexact: boolean;
}

type Operator = '+' | '-' | '*' | '/';

type Token =
  | { kind: 'number'; text: string; pos: number }
  | { kind: 'operator'; op: Operator; pos: number }
  | { kind: 'lparen' | 'rparen' | 'percent'; pos: number };

const OPERATORS: Record<string, Operator> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '–': '-',
  '*': '*',
  '×': '*',
  '·': '*',
  '/': '/',
  '÷': '/',
  ':': '/',
};

// Кома або крапка як десятковий роздільник, необов'язковий порядок: 1e-20, 2,5E3.
const NUMBER = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?/;

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const match = NUMBER.exec(input.slice(i));
    if (match) {
      const end = i + match[0].length;
      if (/^[.,]\d/.test(input.slice(end))) {
        throw new CalcError('Некоректне число: більше одного десяткового роздільника', i);
      }
      tokens.push({ kind: 'number', text: match[0].replace(',', '.'), pos: i });
      i = end;
      continue;
    }
    if (ch in OPERATORS) tokens.push({ kind: 'operator', op: OPERATORS[ch], pos: i });
    else if (ch === '(') tokens.push({ kind: 'lparen', pos: i });
    else if (ch === ')') tokens.push({ kind: 'rparen', pos: i });
    else if (ch === '%') tokens.push({ kind: 'percent', pos: i });
    else throw new CalcError(`Невідомий символ «${ch}»`, i);
    i++;
  }
  return tokens;
}

interface Operand {
  value: Decimal;
  /** Операнд записано як відсоток («10%»), значення вже поділене на 100. */
  percent: boolean;
}

/**
 * Рекурсивний спуск:
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/') unary)*
 *   unary      := ('+' | '-') unary | postfix
 *   postfix    := primary '%'*
 *   primary    := number | '(' expression ')'
 */
class Parser {
  private i = 0;
  inexact = false;

  constructor(
    private readonly tokens: Token[],
    private readonly length: number,
  ) {}

  parse(): Decimal {
    if (this.tokens.length === 0) throw new CalcError('Введіть вираз');
    const result = this.expression().value;
    const extra = this.peek();
    if (extra) {
      if (extra.kind === 'rparen') throw new CalcError('Зайва закриваюча дужка', extra.pos);
      throw new CalcError('Бракує оператора між числами', extra.pos);
    }
    return result;
  }

  private peek(): Token | undefined {
    return this.tokens[this.i];
  }

  private peekOperator(...ops: Operator[]): Operator | undefined {
    const t = this.peek();
    return t?.kind === 'operator' && ops.includes(t.op) ? t.op : undefined;
  }

  private expression(): Operand {
    let left = this.term();
    for (let op = this.peekOperator('+', '-'); op; op = this.peekOperator('+', '-')) {
      this.i++;
      const right = this.term();
      // «200 + 10%» — це 10% від лівої частини, як у звичайних калькуляторах.
      const delta = right.percent ? this.mul(left.value, right.value) : right.value;
      left = {
        value: op === '+' ? this.add(left.value, delta) : this.add(left.value, delta.neg()),
        percent: false,
      };
    }
    return left;
  }

  private term(): Operand {
    let left = this.unary();
    for (let op = this.peekOperator('*', '/'); op; op = this.peekOperator('*', '/')) {
      const pos = this.peek()!.pos;
      this.i++;
      const right = this.unary();
      left = {
        value: op === '*' ? this.mul(left.value, right.value) : this.div(left.value, right.value, pos),
        percent: false,
      };
    }
    return left;
  }

  private unary(): Operand {
    const op = this.peekOperator('+', '-');
    if (op) {
      this.i++;
      const operand = this.unary();
      return op === '-' ? { value: operand.value.neg(), percent: operand.percent } : operand;
    }
    return this.postfix();
  }

  private postfix(): Operand {
    let value = this.primary();
    let percent = false;
    while (this.peek()?.kind === 'percent') {
      this.i++;
      value = value.div(100);
      percent = true;
    }
    return { value, percent };
  }

  private primary(): Decimal {
    const t = this.peek();
    if (!t) throw new CalcError('Вираз обірвано: бракує числа', this.length);
    switch (t.kind) {
      case 'number':
        this.i++;
        return new Dec(t.text);
      case 'lparen': {
        this.i++;
        const inner = this.expression();
        if (this.peek()?.kind !== 'rparen') throw new CalcError('Не закрито дужку', t.pos);
        this.i++;
        return inner.value;
      }
      case 'rparen':
        throw new CalcError('Порожні дужки або бракує числа перед «)»', t.pos);
      case 'percent':
        throw new CalcError('Знак % має стояти після числа', t.pos);
      case 'operator':
        throw new CalcError('Два оператори поспіль', t.pos);
    }
  }

  private checked(result: Decimal, exact: Decimal): Decimal {
    if (!result.isFinite()) throw new CalcError('Результат завеликий');
    if (!result.eq(exact)) this.inexact = true;
    return result;
  }

  private add(a: Decimal, b: Decimal): Decimal {
    return this.checked(a.plus(b), new Exact(a).plus(b));
  }

  private mul(a: Decimal, b: Decimal): Decimal {
    return this.checked(a.times(b), new Exact(a).times(b));
  }

  private div(a: Decimal, b: Decimal, pos: number): Decimal {
    if (b.isZero()) throw new CalcError('Ділення на нуль неможливе', pos);
    const q = a.div(b);
    return this.checked(q, new Exact(q).times(b).eq(a) ? q : new Exact(a).div(b));
  }
}

export function evaluate(input: string): Evaluation {
  const parser = new Parser(tokenize(input), input.length);
  const value = parser.parse();
  // Позбуваємося «−0».
  return { value: value.isZero() ? new Dec(0) : value, inexact: parser.inexact };
}

/** Обчислення без винятку — для живого попереднього перегляду під час введення. */
export function tryEvaluate(input: string): Evaluation | null {
  try {
    return evaluate(input);
  } catch (e) {
    if (e instanceof CalcError) return null;
    throw e;
  }
}
