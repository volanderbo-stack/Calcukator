import type { Formatted } from '../core/format';

/** «= 0.3» або «≈ 0.3333333333» — знак одразу показує, чи значення округлене. */
export function ResultValue({ formatted }: { formatted: Formatted }) {
  return (
    <span className="result-value" title={formatted.rounded ? 'Значення округлене' : 'Точне значення'}>
      <span className={formatted.rounded ? 'sign approx' : 'sign'} aria-label={formatted.rounded ? 'приблизно' : 'дорівнює'}>
        {formatted.rounded ? '≈' : '='}
      </span>{' '}
      <output>{formatted.display}</output>
    </span>
  );
}
