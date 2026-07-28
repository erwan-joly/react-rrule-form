import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RRuleForm } from './RRuleForm';

const dtstart = new Date(Date.UTC(2026, 0, 5, 9, 0)); // Monday 2026-01-05

describe('RRuleForm', () => {
  it('emits BYDAY changes when weekday pills are toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RRuleForm dtstart={dtstart} locale="en-US" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Friday' }));

    expect(onChange).toHaveBeenLastCalledWith('FREQ=WEEKLY;BYDAY=MO,FR', expect.anything());
  });

  it('refuses to deselect the last weekday', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RRuleForm dtstart={dtstart} locale="en-US" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Monday' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches frequency and emits the matching rule', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RRuleForm dtstart={dtstart} locale="en-US" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Monthly' }));

    expect(onChange).toHaveBeenLastCalledWith('FREQ=MONTHLY;BYMONTHDAY=5', expect.anything());
  });

  it('emits COUNT when ends is set to after N occurrences', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RRuleForm dtstart={dtstart} locale="en-US" onChange={onChange} />);

    await user.click(screen.getByLabelText('After'));

    expect(onChange).toHaveBeenLastCalledWith('FREQ=WEEKLY;BYDAY=MO;COUNT=10', expect.anything());
  });

  it('initializes from a provided value', () => {
    render(
      <RRuleForm
        dtstart={dtstart}
        locale="en-US"
        value="FREQ=MONTHLY;BYMONTHDAY=-1"
        showPreview={false}
      />,
    );

    expect(screen.getByLabelText('On day')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Last' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a natural-language summary and occurrence preview', () => {
    render(
      <RRuleForm
        dtstart={dtstart}
        locale="en-US"
        value="FREQ=WEEKLY;INTERVAL=2;BYDAY=MO"
        showPreview={2}
      />,
    );

    expect(screen.getByText('Every 2 weeks on Monday')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders no default classes in unstyled mode', () => {
    const { container } = render(
      <RRuleForm dtstart={dtstart} locale="en-US" unstyled className="custom-root" />,
    );

    expect(container.firstElementChild).toHaveClass('custom-root');
    expect(container.firstElementChild?.className).toBe('custom-root');
  });

  it('merges classNames overrides onto default slots', () => {
    const { container } = render(
      <RRuleForm dtstart={dtstart} locale="en-US" classNames={{ root: 'my-extra' }} />,
    );

    expect(container.firstElementChild).toHaveClass('my-extra');
    expect(container.firstElementChild).toHaveClass('max-w-md');
  });

  // <output> is inline by default, so without an explicit display the summary's
  // padded box overlaps whatever sits above it.
  it('lays the summary out as a block', () => {
    const { container } = render(<RRuleForm dtstart={dtstart} locale="en-US" />);

    expect(container.querySelector('output')).toHaveClass('block');
  });
});
