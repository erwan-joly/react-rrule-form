# react-rrule-form

[![npm version](https://img.shields.io/npm/v/react-rrule-form)](https://www.npmjs.com/package/react-rrule-form)
[![CI](https://github.com/erwan-joly/react-rrule-form/actions/workflows/ci.yml/badge.svg)](https://github.com/erwan-joly/react-rrule-form/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-rrule-form)](./LICENSE)

A recurrence-rule ([RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10) `RRULE`) form component for React — "repeats every 2 weeks on Monday and Friday, until…" as a form, powered by [rrule](https://github.com/jkbrzt/rrule).

**[Live demo (Storybook) →](https://erwan-joly.github.io/react-rrule-form/)**

- 🎨 **Styled with Tailwind, restylable down to every element** — each element maps to a named slot you can override with `classNames`, or start from zero with `unstyled`. Not tied to any UI kit.
- 🗓️ Daily / weekly / monthly / yearly, intervals ("every 2 weeks"), weekday pills, day-of-month grid (incl. "last day"), nth-weekday rules ("the 2nd Monday"), `COUNT` / `UNTIL` endings.
- 💬 Live natural-language summary (`rrule`'s `toText()`, overridable) and an upcoming-occurrences preview.
- 🌍 Weekday/month names and preview dates localize via `Intl`; every static label is a prop.
- ♿ Keyboard-friendly native controls, labelled groups, `aria-pressed` toggles.
- 🌗 Dark mode out of the box (`.dark` class convention).

## Install

```sh
npm install react-rrule-form
```

`react >= 18` is a peer dependency; `rrule` comes as a regular dependency.

## Usage

```tsx
import { RRuleForm } from 'react-rrule-form';

function Scheduler() {
  const [rrule, setRRule] = useState('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR');

  return <RRuleForm value={rrule} onChange={setRRule} dtstart={new Date()} />;
}
```

`onChange` receives the bare RRULE value (`FREQ=WEEKLY;BYDAY=MO` — what most backends store) plus the built [`RRule`](https://github.com/jkbrzt/rrule) instance for anything else (`rule.all()`, `rule.toString()` with `DTSTART`, …). `value` accepts bare values, `RRULE:`-prefixed lines, or full `DTSTART`+`RRULE` strings.

## Styling

### With Tailwind

Tell Tailwind to scan the package so the default classes are generated:

```css
/* your global .css (Tailwind v4) */
@import 'tailwindcss';
@source "../node_modules/react-rrule-form";
```

### Without Tailwind

Import the precompiled stylesheet — no Tailwind setup required:

```tsx
import 'react-rrule-form/styles.css';
```

### Restyling

Every element maps to a slot. Overrides are appended after the defaults and Tailwind conflicts are resolved with [tailwind-merge](https://github.com/dcastil/tailwind-merge), so overriding `bg-*`, `border-*`, etc. just works:

```tsx
<RRuleForm
  classNames={{
    weekdayButtonActive: 'border-violet-600 bg-violet-600 text-white',
    summary: 'rounded-2xl border-dashed border-violet-300',
  }}
/>
```

…or replace everything:

```tsx
<RRuleForm unstyled classNames={{ root: 'my-form', weekdayButton: 'my-pill' }} />
```

Slots: `root`, `group`, `groupLabel`, `frequencyTabs`, `frequencyTab`, `frequencyTabActive`, `row`, `text`, `numberInput`, `dateInput`, `select`, `weekdayGroup`, `weekdayButton`, `weekdayButtonActive`, `monthDayGrid`, `monthDayCell`, `monthDayCellActive`, `radioGroup`, `radioOption`, `radioInput`, `summary`, `preview`, `previewTitle`, `previewList`, `previewItem`. The full default theme is exported as `defaultClassNames`.

Dark mode uses the `.dark` class convention on any ancestor (Tailwind's `@custom-variant dark`).

## Props

| Prop            | Type                                   | Default        | Description                                              |
| --------------- | -------------------------------------- | -------------- | -------------------------------------------------------- |
| `value`         | `string`                               | —              | Controlled RRULE value.                                  |
| `defaultValue`  | `string`                               | —              | Initial value when uncontrolled.                         |
| `onChange`      | `(value: string, rule: RRule) => void` | —              | Fired on every edit.                                     |
| `dtstart`       | `Date`                                 | `new Date()`   | Anchor date for the occurrence preview.                  |
| `weekStart`     | `'MO' \| … \| 'SU'`                    | `'MO'`         | First day shown in the weekday picker.                   |
| `showPreview`   | `number \| false`                      | `3`            | Upcoming occurrences to preview.                         |
| `showSummary`   | `boolean`                              | `true`         | Show the natural-language summary.                       |
| `renderSummary` | `(rule: RRule) => ReactNode`           | `toText()`     | Custom summary (e.g. for localization).                  |
| `locale`        | `string`                               | browser locale | BCP 47 locale for weekday/month names and preview dates. |
| `labels`        | `Partial<RRuleFormLabels>`             | English        | Override any static label.                               |
| `classNames`    | `Partial<RRuleFormClassNames>`         | —              | Per-slot class overrides.                                |
| `unstyled`      | `boolean`                              | `false`        | Drop all default classes.                                |
| `disabled`      | `boolean`                              | `false`        | Disable every control.                                   |

The state helpers (`buildRRule`, `stateFromRRule`, `rruleValue`, `parseRRuleString`, `defaultFormState`) are exported too, in case you want to build your own UI on top of the same mapping.

## Contributing

```sh
pnpm install
pnpm dev          # Storybook playground
pnpm test         # vitest
pnpm lint
pnpm build        # tsup + precompiled styles.css
```

Releases: bump `version` in `package.json`, tag `v<version>`, push the tag. CI verifies the tag matches the package version, then publishes to npm with provenance and redeploys the Storybook to GitHub Pages.

## License

[MIT](./LICENSE)
