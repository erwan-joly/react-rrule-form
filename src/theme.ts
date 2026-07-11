import { twMerge } from 'tailwind-merge';

export interface RRuleFormClassNames {
  root: string;
  group: string;
  groupLabel: string;
  frequencyTabs: string;
  frequencyTab: string;
  frequencyTabActive: string;
  row: string;
  text: string;
  numberInput: string;
  dateInput: string;
  select: string;
  weekdayGroup: string;
  weekdayButton: string;
  weekdayButtonActive: string;
  monthDayGrid: string;
  monthDayCell: string;
  monthDayCellActive: string;
  radioGroup: string;
  radioOption: string;
  radioInput: string;
  summary: string;
  preview: string;
  previewTitle: string;
  previewList: string;
  previewItem: string;
}

export type RRuleFormSlot = keyof RRuleFormClassNames;

const input =
  'rounded-md border border-zinc-300 bg-white px-2 py-1.5 outline-none transition-colors ' +
  'focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 disabled:cursor-not-allowed ' +
  'disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900';

export const defaultClassNames: RRuleFormClassNames = {
  root: 'flex w-full max-w-md flex-col gap-5 text-sm text-zinc-900 dark:text-zinc-100',
  group: 'flex flex-col gap-2',
  groupLabel: 'text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
  frequencyTabs: 'grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800',
  frequencyTab:
    'cursor-pointer rounded-md px-2 py-1.5 text-center font-medium text-zinc-600 transition-colors ' +
    'hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
  frequencyTabActive:
    'bg-white text-zinc-900 shadow-sm hover:text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:text-zinc-50',
  row: 'flex flex-wrap items-center gap-2',
  text: 'text-zinc-600 dark:text-zinc-400',
  numberInput: `w-16 text-center tabular-nums ${input}`,
  dateInput: input,
  select: input,
  weekdayGroup: 'flex flex-wrap gap-1',
  weekdayButton:
    'h-9 w-9 cursor-pointer rounded-full border border-zinc-300 text-xs font-medium text-zinc-600 ' +
    'transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 ' +
    'dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500',
  weekdayButtonActive:
    'border-zinc-900 bg-zinc-900 text-white hover:border-zinc-900 ' +
    'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:border-zinc-100',
  monthDayGrid: 'grid grid-cols-7 gap-1',
  monthDayCell:
    'flex h-9 cursor-pointer items-center justify-center rounded-md border border-zinc-200 text-xs ' +
    'tabular-nums text-zinc-600 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed ' +
    'disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500',
  monthDayCellActive:
    'border-zinc-900 bg-zinc-900 text-white hover:border-zinc-900 ' +
    'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:border-zinc-100',
  radioGroup: 'flex flex-col gap-2',
  radioOption: 'flex flex-wrap items-center gap-2',
  radioInput: 'h-4 w-4 accent-zinc-900 dark:accent-zinc-100',
  summary:
    'rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700 ' +
    'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  preview: 'flex flex-col gap-1.5',
  previewTitle: 'text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
  previewList: 'flex flex-col gap-1',
  previewItem:
    'rounded-md bg-zinc-100 px-3 py-1.5 tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

/**
 * Joins class fragments and resolves Tailwind conflicts, so an override like
 * `bg-violet-600` reliably wins over a default `bg-zinc-900` regardless of
 * stylesheet order.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '));
}
