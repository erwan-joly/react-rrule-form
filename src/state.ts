import { RRule, Weekday, type ByWeekday, type Options } from 'rrule';

export type FrequencyKey = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type WeekdayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export type Ordinal = 1 | 2 | 3 | 4 | -1;
export type EndsMode = 'never' | 'count' | 'until';

export interface FormState {
  freq: FrequencyKey;
  interval: number;
  /** WEEKLY: selected weekdays */
  weekdays: WeekdayCode[];
  monthlyMode: 'day' | 'weekday';
  /** MONTHLY day mode: days of month, -1 meaning the last day */
  monthDays: number[];
  ordinal: Ordinal;
  ordinalWeekday: WeekdayCode;
  yearlyMode: 'day' | 'weekday';
  /** 1-12 */
  month: number;
  dayOfMonth: number;
  ends: EndsMode;
  count: number;
  /** yyyy-mm-dd, empty when unset */
  until: string;
}

export const WEEKDAY_CODES: WeekdayCode[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const WD: Record<WeekdayCode, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

const FREQ_TO_RRULE: Record<FrequencyKey, number> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

/** JS Date#getDay() (0 = Sunday) to weekday code. */
const JS_DAY_TO_CODE: WeekdayCode[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function weekdayCodeOf(date: Date): WeekdayCode {
  return JS_DAY_TO_CODE[date.getDay()] as WeekdayCode;
}

export function defaultFormState(dtstart: Date): FormState {
  const code = weekdayCodeOf(dtstart);
  return {
    freq: 'WEEKLY',
    interval: 1,
    weekdays: [code],
    monthlyMode: 'day',
    monthDays: [Math.min(dtstart.getDate(), 28)],
    ordinal: 1,
    ordinalWeekday: code,
    yearlyMode: 'day',
    month: dtstart.getMonth() + 1,
    dayOfMonth: dtstart.getDate(),
    ends: 'never',
    count: 10,
    until: '',
  };
}

export function buildRRule(state: FormState, dtstart?: Date): RRule {
  const options: Partial<Options> = { freq: FREQ_TO_RRULE[state.freq] };
  if (dtstart) options.dtstart = dtstart;
  if (state.interval > 1) options.interval = state.interval;

  switch (state.freq) {
    case 'DAILY':
      break;
    case 'WEEKLY':
      if (state.weekdays.length > 0) {
        options.byweekday = state.weekdays.map((code) => WD[code]);
      }
      break;
    case 'MONTHLY':
      if (state.monthlyMode === 'day') {
        if (state.monthDays.length > 0) {
          options.bymonthday = [...state.monthDays].sort((a, b) => a - b);
        }
      } else {
        options.byweekday = [WD[state.ordinalWeekday].nth(state.ordinal)];
      }
      break;
    case 'YEARLY':
      options.bymonth = [state.month];
      if (state.yearlyMode === 'day') {
        options.bymonthday = [state.dayOfMonth];
      } else {
        options.byweekday = [WD[state.ordinalWeekday].nth(state.ordinal)];
      }
      break;
  }

  if (state.ends === 'count') {
    options.count = state.count;
  } else if (state.ends === 'until' && state.until) {
    const [y, m, d] = state.until.split('-').map(Number);
    if (y && m && d) options.until = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  }

  return new RRule(options);
}

/** The bare RRULE value ("FREQ=..."), without the "RRULE:" prefix or a DTSTART line. */
export function rruleValue(rule: RRule): string {
  const line = rule
    .toString()
    .split('\n')
    .find((l) => l.startsWith('RRULE:'));
  return line ? line.slice('RRULE:'.length) : rule.toString();
}

/** Accepts a bare value ("FREQ=..."), an "RRULE:..." line, or a full DTSTART+RRULE string. */
export function parseRRuleString(value: string): RRule {
  return RRule.fromString(value.trim());
}

interface NormalizedWeekday {
  code: WeekdayCode;
  n?: number;
}

function normalizeWeekday(entry: ByWeekday): NormalizedWeekday {
  if (entry instanceof Weekday) {
    return { code: WEEKDAY_CODES[entry.weekday] as WeekdayCode, n: entry.n };
  }
  if (typeof entry === 'number') {
    return { code: WEEKDAY_CODES[entry] as WeekdayCode };
  }
  const match = /^([+-]?\d+)?(MO|TU|WE|TH|FR|SA|SU)$/.exec(entry);
  if (!match) return { code: 'MO' };
  return {
    code: match[2] as WeekdayCode,
    n: match[1] ? Number(match[1]) : undefined,
  };
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function toOrdinal(n: number | undefined): Ordinal {
  return n === 2 || n === 3 || n === 4 || n === -1 ? n : 1;
}

const RRULE_TO_FREQ = new Map<number, FrequencyKey>([
  [RRule.DAILY, 'DAILY'],
  [RRule.WEEKLY, 'WEEKLY'],
  [RRule.MONTHLY, 'MONTHLY'],
  [RRule.YEARLY, 'YEARLY'],
]);

export function stateFromRRule(rule: RRule, base: FormState): FormState {
  const o = rule.origOptions;
  const state: FormState = { ...base };

  state.freq = (o.freq != null && RRULE_TO_FREQ.get(o.freq)) || base.freq;
  state.interval = o.interval && o.interval > 0 ? o.interval : 1;

  const weekdays = toArray(o.byweekday).map(normalizeWeekday);
  const monthDays = toArray(o.bymonthday);
  const months = toArray(o.bymonth);
  const setPos = toArray(o.bysetpos)[0];

  if (state.freq === 'WEEKLY' && weekdays.length > 0) {
    state.weekdays = weekdays.map((w) => w.code);
  }

  if (state.freq === 'MONTHLY' || state.freq === 'YEARLY') {
    const nthWeekday = weekdays[0];
    if (nthWeekday) {
      const mode = 'weekday' as const;
      if (state.freq === 'MONTHLY') state.monthlyMode = mode;
      else state.yearlyMode = mode;
      state.ordinalWeekday = nthWeekday.code;
      state.ordinal = toOrdinal(nthWeekday.n ?? setPos);
    } else {
      if (state.freq === 'MONTHLY') {
        state.monthlyMode = 'day';
        if (monthDays.length > 0) state.monthDays = monthDays;
      } else {
        state.yearlyMode = 'day';
        if (monthDays[0] != null) state.dayOfMonth = monthDays[0];
      }
    }
    if (state.freq === 'YEARLY' && months[0] != null) state.month = months[0];
  }

  if (o.count != null) {
    state.ends = 'count';
    state.count = o.count;
  } else if (o.until instanceof Date) {
    state.ends = 'until';
    const y = o.until.getUTCFullYear();
    const m = String(o.until.getUTCMonth() + 1).padStart(2, '0');
    const d = String(o.until.getUTCDate()).padStart(2, '0');
    state.until = `${y}-${m}-${d}`;
  } else {
    state.ends = 'never';
  }

  return state;
}
