import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RRuleForm } from './RRuleForm';

const meta = {
  title: 'RRuleForm',
  component: RRuleForm,
  args: {
    dtstart: new Date(Date.UTC(2026, 0, 5, 9, 0)),
    locale: 'en-US',
  },
  argTypes: {
    onChange: { action: 'change' },
    dtstart: { control: false },
    renderSummary: { control: false },
  },
} satisfies Meta<typeof RRuleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithInitialValue: Story = {
  args: {
    defaultValue: 'FREQ=MONTHLY;BYDAY=+2MO;COUNT=12',
    showPreview: 5,
  },
};

export const WeekStartsOnSunday: Story = {
  args: {
    weekStart: 'SU',
  },
};

export const French: Story = {
  args: {
    locale: 'fr-FR',
    labels: {
      repeats: 'Répétition',
      every: 'Tous les',
      frequencies: { DAILY: 'Quotidien', WEEKLY: 'Hebdo', MONTHLY: 'Mensuel', YEARLY: 'Annuel' },
      units: {
        DAILY: ['jour', 'jours'],
        WEEKLY: ['semaine', 'semaines'],
        MONTHLY: ['mois', 'mois'],
        YEARLY: ['an', 'ans'],
      },
      on: 'Le',
      onDay: 'Le jour',
      onThe: 'Le',
      lastDay: 'Dernier',
      ordinals: { 1: 'premier', 2: 'deuxième', 3: 'troisième', 4: 'quatrième', '-1': 'dernier' },
      of: 'de',
      ends: 'Fin',
      never: 'Jamais',
      after: 'Après',
      occurrences: ['occurrence', 'occurrences'],
      onDate: 'Le',
      previewTitle: 'Prochaines occurrences',
    },
    // rrule's toText() is English-only, so localized apps supply their own summary.
    renderSummary: (rule) => rule.toString().split('\n').pop(),
  },
};

const brandTheme = {
  root: 'flex w-full max-w-md flex-col gap-5 font-mono text-sm text-violet-950 dark:text-violet-100',
  groupLabel: 'text-xs font-semibold uppercase tracking-widest text-violet-500',
  frequencyTabs: 'flex gap-2 bg-transparent p-0',
  frequencyTab:
    'flex-1 rounded-full border-2 border-violet-200 px-2 py-1.5 text-center font-semibold text-violet-400 transition-all hover:border-violet-400 dark:border-violet-900 dark:text-violet-500',
  frequencyTabActive:
    'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:border-violet-600 dark:border-violet-500 dark:bg-violet-500 dark:text-white',
  weekdayButton:
    'h-10 w-10 rounded-xl border-2 border-violet-200 text-xs font-bold text-violet-400 transition-all hover:border-violet-400 dark:border-violet-900 dark:text-violet-500',
  weekdayButtonActive:
    'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:border-violet-600 dark:border-violet-500 dark:bg-violet-500 dark:text-white',
  monthDayCellActive:
    'border-violet-600 bg-violet-600 text-white hover:border-violet-600 dark:border-violet-500 dark:bg-violet-500',
  radioInput: 'h-4 w-4 accent-violet-600',
  summary:
    'rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 px-4 py-3 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100',
  previewItem:
    'rounded-full bg-violet-100 px-4 py-1.5 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
};

export const CustomTheme: Story = {
  args: {
    classNames: brandTheme,
    showPreview: 4,
  },
};

export const Unstyled: Story = {
  args: {
    unstyled: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR',
  },
};

function ControlledExample() {
  const [value, setValue] = useState('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR');
  return (
    <div className="flex flex-col gap-4">
      <input
        aria-label="RRULE value"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <RRuleForm
        value={value}
        onChange={setValue}
        dtstart={new Date(Date.UTC(2026, 0, 5, 9, 0))}
        locale="en-US"
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledExample />,
};
