import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { RRule } from 'rrule';
import { defaultLabels, type RRuleFormLabels } from '../labels';
import {
  buildRRule,
  defaultFormState,
  parseRRuleString,
  rruleValue,
  stateFromRRule,
  WEEKDAY_CODES,
  type EndsMode,
  type FormState,
  type FrequencyKey,
  type Ordinal,
  type WeekdayCode,
} from '../state';
import { cx, defaultClassNames, type RRuleFormClassNames } from '../theme';

export interface RRuleFormProps {
  /** Controlled RRULE value. Accepts "FREQ=...", "RRULE:FREQ=..." or a full DTSTART+RRULE string. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Called with the bare RRULE value ("FREQ=...") and the built RRule instance. */
  onChange?: (value: string, rule: RRule) => void;
  /** Anchor date used for the occurrence preview (DTSTART). Defaults to now. */
  dtstart?: Date;
  /** First day of the week in the weekday picker. Display only. */
  weekStart?: WeekdayCode;
  /** Number of upcoming occurrences to preview, or false to hide. */
  showPreview?: number | false;
  /** Show the natural-language summary of the rule. */
  showSummary?: boolean;
  /** Replace the default `rule.toText()` summary. */
  renderSummary?: (rule: RRule) => ReactNode;
  /** BCP 47 locale for weekday/month names and preview dates. Defaults to the browser locale. */
  locale?: string;
  labels?: Partial<RRuleFormLabels>;
  /** Per-slot class overrides, merged after the defaults. */
  classNames?: Partial<RRuleFormClassNames>;
  /** Drop every default class; only `classNames` values apply. */
  unstyled?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const FREQUENCIES: FrequencyKey[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const ORDINALS: Ordinal[] = [1, 2, 3, 4, -1];

/** 2024-01-01 was a Monday; index i is the day i steps after Monday. */
function weekdayName(code: WeekdayCode, locale: string | undefined, style: 'short' | 'long') {
  const date = new Date(Date.UTC(2024, 0, 1 + WEEKDAY_CODES.indexOf(code)));
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(date);
}

function monthName(month: number, locale: string | undefined) {
  const date = new Date(Date.UTC(2024, month - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(date);
}

export function RRuleForm({
  value,
  defaultValue,
  onChange,
  dtstart,
  weekStart = 'MO',
  showPreview = 3,
  showSummary = true,
  renderSummary,
  locale,
  labels: labelOverrides,
  classNames,
  unstyled = false,
  disabled = false,
  className,
  id,
}: RRuleFormProps) {
  const formId = useId();
  const labels = useMemo(() => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);

  const anchor = useMemo(() => dtstart ?? new Date(), [dtstart]);

  const [state, setState] = useState<FormState>(() => {
    const base = defaultFormState(anchor);
    const initial = value ?? defaultValue;
    if (!initial) return base;
    try {
      return stateFromRRule(parseRRuleString(initial), base);
    } catch {
      return base;
    }
  });

  const lastEmitted = useRef<string | null>(null);

  useEffect(() => {
    if (value == null || value === lastEmitted.current) return;
    try {
      setState((current) => stateFromRRule(parseRRuleString(value), current));
      lastEmitted.current = value;
    } catch {
      // Ignore unparseable external values and keep the current form state.
    }
  }, [value]);

  const update = (partial: Partial<FormState>) => {
    const next = { ...state, ...partial };
    setState(next);
    const rule = buildRRule(next, anchor);
    const nextValue = rruleValue(rule);
    lastEmitted.current = nextValue;
    onChange?.(nextValue, rule);
  };

  const rule = useMemo(() => buildRRule(state, anchor), [state, anchor]);

  const occurrences = useMemo(() => {
    if (showPreview === false || showPreview <= 0) return [];
    try {
      return rule.all((_, index) => index < showPreview);
    } catch {
      return [];
    }
  }, [rule, showPreview]);

  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

  const cls = (slot: keyof RRuleFormClassNames): string | undefined =>
    cx(!unstyled && defaultClassNames[slot], classNames?.[slot]) || undefined;

  const activeCls = (
    slot: 'frequencyTab' | 'weekdayButton' | 'monthDayCell',
    active: boolean,
  ): string | undefined => {
    const activeSlot = `${slot}Active` as const;
    return (
      cx(
        !unstyled && defaultClassNames[slot],
        classNames?.[slot],
        active && !unstyled && defaultClassNames[activeSlot],
        active && classNames?.[activeSlot],
      ) || undefined
    );
  };

  const orderedWeekdays = useMemo(() => {
    const start = WEEKDAY_CODES.indexOf(weekStart);
    return WEEKDAY_CODES.map((_, i) => WEEKDAY_CODES[(start + i) % 7] as WeekdayCode);
  }, [weekStart]);

  const unit = labels.units[state.freq][state.interval > 1 ? 1 : 0];

  const summary = useMemo(() => {
    if (renderSummary) return renderSummary(rule);
    const text = rule.toText();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }, [rule, renderSummary]);

  const toggleWeekday = (code: WeekdayCode) => {
    const selected = state.weekdays.includes(code);
    const weekdays = selected
      ? state.weekdays.filter((c) => c !== code)
      : [...state.weekdays, code];
    if (weekdays.length === 0) return;
    update({ weekdays });
  };

  const toggleMonthDay = (day: number) => {
    const selected = state.monthDays.includes(day);
    const monthDays = selected
      ? state.monthDays.filter((d) => d !== day)
      : [...state.monthDays, day];
    if (monthDays.length === 0) return;
    update({ monthDays });
  };

  const parsePositiveInt = (raw: string, fallback: number) => {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  };

  const ordinalWeekdayPicker = (
    <>
      <select
        aria-label={labels.onThe}
        className={cls('select')}
        disabled={disabled}
        value={state.ordinal}
        onChange={(e) => update({ ordinal: Number(e.target.value) as Ordinal })}
      >
        {ORDINALS.map((ordinal) => (
          <option key={ordinal} value={ordinal}>
            {labels.ordinals[String(ordinal) as keyof RRuleFormLabels['ordinals']]}
          </option>
        ))}
      </select>
      <select
        aria-label={labels.on}
        className={cls('select')}
        disabled={disabled}
        value={state.ordinalWeekday}
        onChange={(e) => update({ ordinalWeekday: e.target.value as WeekdayCode })}
      >
        {orderedWeekdays.map((code) => (
          <option key={code} value={code}>
            {weekdayName(code, locale, 'long')}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <div id={id} className={cx(cls('root'), className) || undefined}>
      <div className={cls('group')}>
        <span className={cls('groupLabel')} id={`${formId}-freq`}>
          {labels.repeats}
        </span>
        <div className={cls('frequencyTabs')} role="group" aria-labelledby={`${formId}-freq`}>
          {FREQUENCIES.map((freq) => (
            <button
              key={freq}
              type="button"
              disabled={disabled}
              aria-pressed={state.freq === freq}
              className={activeCls('frequencyTab', state.freq === freq)}
              onClick={() => update({ freq })}
            >
              {labels.frequencies[freq]}
            </button>
          ))}
        </div>
      </div>

      <div className={cls('group')}>
        <div className={cls('row')}>
          <label className={cls('text')} htmlFor={`${formId}-interval`}>
            {labels.every}
          </label>
          <input
            id={`${formId}-interval`}
            className={cls('numberInput')}
            type="number"
            inputMode="numeric"
            min={1}
            disabled={disabled}
            value={state.interval}
            onChange={(e) => update({ interval: parsePositiveInt(e.target.value, 1) })}
          />
          <span className={cls('text')}>{unit}</span>
        </div>
      </div>

      {state.freq === 'WEEKLY' && (
        <div className={cls('group')}>
          <span className={cls('groupLabel')} id={`${formId}-weekdays`}>
            {labels.on}
          </span>
          <div className={cls('weekdayGroup')} role="group" aria-labelledby={`${formId}-weekdays`}>
            {orderedWeekdays.map((code) => {
              const selected = state.weekdays.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={weekdayName(code, locale, 'long')}
                  className={activeCls('weekdayButton', selected)}
                  onClick={() => toggleWeekday(code)}
                >
                  {weekdayName(code, locale, 'short')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.freq === 'MONTHLY' && (
        <div className={cls('group')}>
          <div className={cls('radioGroup')}>
            <div className={cls('radioOption')}>
              <input
                id={`${formId}-monthly-day`}
                className={cls('radioInput')}
                type="radio"
                name={`${formId}-monthly-mode`}
                disabled={disabled}
                checked={state.monthlyMode === 'day'}
                onChange={() => update({ monthlyMode: 'day' })}
              />
              <label className={cls('text')} htmlFor={`${formId}-monthly-day`}>
                {labels.onDay}
              </label>
            </div>
            {state.monthlyMode === 'day' && (
              <div className={cls('monthDayGrid')}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const selected = state.monthDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      className={activeCls('monthDayCell', selected)}
                      onClick={() => toggleMonthDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={state.monthDays.includes(-1)}
                  aria-label={labels.lastDay}
                  className={activeCls('monthDayCell', state.monthDays.includes(-1))}
                  onClick={() => toggleMonthDay(-1)}
                >
                  {labels.lastDay}
                </button>
              </div>
            )}
            <div className={cls('radioOption')}>
              <input
                id={`${formId}-monthly-weekday`}
                className={cls('radioInput')}
                type="radio"
                name={`${formId}-monthly-mode`}
                disabled={disabled}
                checked={state.monthlyMode === 'weekday'}
                onChange={() => update({ monthlyMode: 'weekday' })}
              />
              <label className={cls('text')} htmlFor={`${formId}-monthly-weekday`}>
                {labels.onThe}
              </label>
              {state.monthlyMode === 'weekday' && ordinalWeekdayPicker}
            </div>
          </div>
        </div>
      )}

      {state.freq === 'YEARLY' && (
        <div className={cls('group')}>
          <div className={cls('radioGroup')}>
            <div className={cls('radioOption')}>
              <input
                id={`${formId}-yearly-day`}
                className={cls('radioInput')}
                type="radio"
                name={`${formId}-yearly-mode`}
                disabled={disabled}
                checked={state.yearlyMode === 'day'}
                onChange={() => update({ yearlyMode: 'day' })}
              />
              <label className={cls('text')} htmlFor={`${formId}-yearly-day`}>
                {labels.on}
              </label>
              {state.yearlyMode === 'day' && (
                <>
                  <select
                    aria-label={labels.of}
                    className={cls('select')}
                    disabled={disabled}
                    value={state.month}
                    onChange={(e) => update({ month: Number(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {monthName(month, locale)}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={labels.onDay}
                    className={cls('numberInput')}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    disabled={disabled}
                    value={state.dayOfMonth}
                    onChange={(e) =>
                      update({ dayOfMonth: Math.min(parsePositiveInt(e.target.value, 1), 31) })
                    }
                  />
                </>
              )}
            </div>
            <div className={cls('radioOption')}>
              <input
                id={`${formId}-yearly-weekday`}
                className={cls('radioInput')}
                type="radio"
                name={`${formId}-yearly-mode`}
                disabled={disabled}
                checked={state.yearlyMode === 'weekday'}
                onChange={() => update({ yearlyMode: 'weekday' })}
              />
              <label className={cls('text')} htmlFor={`${formId}-yearly-weekday`}>
                {labels.onThe}
              </label>
              {state.yearlyMode === 'weekday' && (
                <>
                  {ordinalWeekdayPicker}
                  <span className={cls('text')}>{labels.of}</span>
                  <select
                    aria-label={labels.of}
                    className={cls('select')}
                    disabled={disabled}
                    value={state.month}
                    onChange={(e) => update({ month: Number(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {monthName(month, locale)}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={cls('group')}>
        <span className={cls('groupLabel')} id={`${formId}-ends`}>
          {labels.ends}
        </span>
        <div className={cls('radioGroup')} role="group" aria-labelledby={`${formId}-ends`}>
          {(['never', 'count', 'until'] as EndsMode[]).map((mode) => (
            <div key={mode} className={cls('radioOption')}>
              <input
                id={`${formId}-ends-${mode}`}
                className={cls('radioInput')}
                type="radio"
                name={`${formId}-ends`}
                disabled={disabled}
                checked={state.ends === mode}
                onChange={() => update({ ends: mode })}
              />
              <label className={cls('text')} htmlFor={`${formId}-ends-${mode}`}>
                {mode === 'never' ? labels.never : mode === 'count' ? labels.after : labels.onDate}
              </label>
              {mode === 'count' && state.ends === 'count' && (
                <>
                  <input
                    aria-label={labels.occurrences[1]}
                    className={cls('numberInput')}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    disabled={disabled}
                    value={state.count}
                    onChange={(e) => update({ count: parsePositiveInt(e.target.value, 1) })}
                  />
                  <span className={cls('text')}>{labels.occurrences[state.count > 1 ? 1 : 0]}</span>
                </>
              )}
              {mode === 'until' && state.ends === 'until' && (
                <input
                  aria-label={labels.onDate}
                  className={cls('dateInput')}
                  type="date"
                  disabled={disabled}
                  value={state.until}
                  onChange={(e) => update({ until: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {showSummary && (
        <output className={cls('summary')} htmlFor={`${formId}-interval`}>
          {summary}
        </output>
      )}

      {occurrences.length > 0 && (
        <div className={cls('preview')}>
          <span className={cls('previewTitle')}>{labels.previewTitle}</span>
          <ul className={cls('previewList')}>
            {occurrences.map((date) => (
              <li key={date.toISOString()} className={cls('previewItem')}>
                {dateFormat.format(date)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
