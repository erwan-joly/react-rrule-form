import { describe, expect, it } from 'vitest';
import {
  buildRRule,
  defaultFormState,
  parseRRuleString,
  rruleValue,
  stateFromRRule,
  type FormState,
} from './state';

const dtstart = new Date(Date.UTC(2026, 0, 5, 9, 0)); // Monday 2026-01-05

function base(overrides: Partial<FormState> = {}): FormState {
  return { ...defaultFormState(dtstart), ...overrides };
}

describe('buildRRule / rruleValue', () => {
  it('serializes a fortnightly weekly rule', () => {
    const rule = buildRRule(base({ freq: 'WEEKLY', interval: 2, weekdays: ['MO', 'FR'] }));
    expect(rruleValue(rule)).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR');
  });

  it('serializes monthly by day with last-day marker', () => {
    const rule = buildRRule(base({ freq: 'MONTHLY', monthlyMode: 'day', monthDays: [15, -1] }));
    expect(rruleValue(rule)).toBe('FREQ=MONTHLY;BYMONTHDAY=-1,15');
  });

  it('serializes monthly nth-weekday rules', () => {
    const rule = buildRRule(
      base({ freq: 'MONTHLY', monthlyMode: 'weekday', ordinal: 2, ordinalWeekday: 'MO' }),
    );
    expect(rruleValue(rule)).toBe('FREQ=MONTHLY;BYDAY=+2MO');
  });

  it('serializes yearly rules with month and day', () => {
    const rule = buildRRule(base({ freq: 'YEARLY', yearlyMode: 'day', month: 1, dayOfMonth: 5 }));
    expect(rruleValue(rule)).toBe('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=5');
  });

  it('serializes count and until endings', () => {
    expect(rruleValue(buildRRule(base({ freq: 'DAILY', ends: 'count', count: 12 })))).toBe(
      'FREQ=DAILY;COUNT=12',
    );
    expect(
      rruleValue(buildRRule(base({ freq: 'DAILY', ends: 'until', until: '2026-12-31' }))),
    ).toBe('FREQ=DAILY;UNTIL=20261231T235959Z');
  });

  it('never emits a DTSTART line in the value', () => {
    const rule = buildRRule(base({ freq: 'DAILY' }), dtstart);
    expect(rruleValue(rule)).toBe('FREQ=DAILY');
  });
});

describe('occurrence preview via rrule', () => {
  it('keeps fortnightly anchor parity from dtstart', () => {
    const rule = buildRRule(base({ freq: 'WEEKLY', interval: 2, weekdays: ['MO'] }), dtstart);
    const [first, second] = rule.all((_, i) => i < 2);
    expect(first?.toISOString()).toBe('2026-01-05T09:00:00.000Z');
    expect(second?.toISOString()).toBe('2026-01-19T09:00:00.000Z');
  });

  it('resolves the last day of the month', () => {
    const rule = buildRRule(
      base({ freq: 'MONTHLY', monthlyMode: 'day', monthDays: [-1] }),
      dtstart,
    );
    const [first, second] = rule.all((_, i) => i < 2);
    expect(first?.getUTCDate()).toBe(31);
    expect(second?.toISOString()).toBe('2026-02-28T09:00:00.000Z');
  });
});

describe('stateFromRRule', () => {
  const fallback = defaultFormState(dtstart);

  it('round-trips a weekly rule', () => {
    const state = stateFromRRule(parseRRuleString('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR'), fallback);
    expect(state.freq).toBe('WEEKLY');
    expect(state.interval).toBe(2);
    expect(state.weekdays).toEqual(['MO', 'FR']);
    expect(state.ends).toBe('never');
  });

  it('parses nth-weekday via BYDAY ordinal', () => {
    const state = stateFromRRule(parseRRuleString('FREQ=MONTHLY;BYDAY=+2MO'), fallback);
    expect(state.monthlyMode).toBe('weekday');
    expect(state.ordinal).toBe(2);
    expect(state.ordinalWeekday).toBe('MO');
  });

  it('parses nth-weekday via BYSETPOS', () => {
    const state = stateFromRRule(parseRRuleString('FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1'), fallback);
    expect(state.monthlyMode).toBe('weekday');
    expect(state.ordinal).toBe(-1);
    expect(state.ordinalWeekday).toBe('FR');
  });

  it('parses month days including the last-day marker', () => {
    const state = stateFromRRule(parseRRuleString('FREQ=MONTHLY;BYMONTHDAY=-1,15'), fallback);
    expect(state.monthlyMode).toBe('day');
    expect([...state.monthDays].sort((a, b) => a - b)).toEqual([-1, 15]);
  });

  it('parses count and until endings', () => {
    const withCount = stateFromRRule(parseRRuleString('FREQ=DAILY;COUNT=5'), fallback);
    expect(withCount.ends).toBe('count');
    expect(withCount.count).toBe(5);

    const withUntil = stateFromRRule(
      parseRRuleString('FREQ=DAILY;UNTIL=20261231T235959Z'),
      fallback,
    );
    expect(withUntil.ends).toBe('until');
    expect(withUntil.until).toBe('2026-12-31');
  });

  it('accepts RRULE: prefixed and DTSTART-carrying strings', () => {
    const prefixed = stateFromRRule(parseRRuleString('RRULE:FREQ=YEARLY;BYMONTH=3'), fallback);
    expect(prefixed.freq).toBe('YEARLY');
    expect(prefixed.month).toBe(3);

    const full = stateFromRRule(
      parseRRuleString('DTSTART:20260105T090000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE'),
      fallback,
    );
    expect(full.freq).toBe('WEEKLY');
    expect(full.weekdays).toEqual(['WE']);
  });

  it('full round-trip: state -> string -> state', () => {
    const original = base({
      freq: 'MONTHLY',
      interval: 3,
      monthlyMode: 'weekday',
      ordinal: -1,
      ordinalWeekday: 'FR',
      ends: 'count',
      count: 8,
    });
    const restored = stateFromRRule(parseRRuleString(rruleValue(buildRRule(original))), fallback);
    expect(restored.freq).toBe('MONTHLY');
    expect(restored.interval).toBe(3);
    expect(restored.monthlyMode).toBe('weekday');
    expect(restored.ordinal).toBe(-1);
    expect(restored.ordinalWeekday).toBe('FR');
    expect(restored.ends).toBe('count');
    expect(restored.count).toBe(8);
  });
});
