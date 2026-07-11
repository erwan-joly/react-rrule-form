import type { FrequencyKey } from './state';

export interface RRuleFormLabels {
  repeats: string;
  every: string;
  frequencies: Record<FrequencyKey, string>;
  /** [singular, plural] */
  units: Record<FrequencyKey, [string, string]>;
  on: string;
  onDay: string;
  onThe: string;
  lastDay: string;
  ordinals: { 1: string; 2: string; 3: string; 4: string; '-1': string };
  of: string;
  ends: string;
  never: string;
  after: string;
  /** [singular, plural] */
  occurrences: [string, string];
  onDate: string;
  previewTitle: string;
}

export const defaultLabels: RRuleFormLabels = {
  repeats: 'Repeats',
  every: 'Every',
  frequencies: {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
  },
  units: {
    DAILY: ['day', 'days'],
    WEEKLY: ['week', 'weeks'],
    MONTHLY: ['month', 'months'],
    YEARLY: ['year', 'years'],
  },
  on: 'On',
  onDay: 'On day',
  onThe: 'On the',
  lastDay: 'Last',
  ordinals: { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', '-1': 'last' },
  of: 'of',
  ends: 'Ends',
  never: 'Never',
  after: 'After',
  occurrences: ['occurrence', 'occurrences'],
  onDate: 'On',
  previewTitle: 'Next occurrences',
};
