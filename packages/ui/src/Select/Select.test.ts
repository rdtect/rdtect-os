/**
 * Select — O1 Design System
 *
 * Tests for the Select component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Select from './Select.svelte';

const stringOptions = ['red', 'green', 'blue'];

const objectOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico', disabled: true },
];

describe('Select', () => {
  it('renders a select with the combobox role', () => {
    render(Select, { props: { options: stringOptions } });
    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
  });

  it('renders with label', () => {
    render(Select, { props: { label: 'Color', options: stringOptions } });
    expect(screen.getByLabelText('Color')).toBeDefined();
  });

  it('renders string options as value+label pairs', () => {
    render(Select, { props: { options: stringOptions } });
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toBe('red');
    expect(options[0].getAttribute('value')).toBe('red');
    expect(options[2].textContent).toBe('blue');
  });

  it('renders object options with custom values', () => {
    render(Select, { props: { options: objectOptions } });
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toBe('United States');
    expect(options[0].getAttribute('value')).toBe('us');
  });

  it('marks disabled options', () => {
    render(Select, { props: { options: objectOptions } });
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options[2].hasAttribute('disabled')).toBe(true);
    expect(options[0].hasAttribute('disabled')).toBe(false);
  });

  it('shows placeholder as a disabled empty option', () => {
    render(Select, { props: { options: stringOptions, placeholder: 'Choose...' } });
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(4);
    expect(options[0].textContent).toBe('Choose...');
    expect(options[0].getAttribute('value')).toBe('');
    expect(options[0].hasAttribute('disabled')).toBe(true);
  });

  it('sets the selected value', () => {
    render(Select, { props: { options: stringOptions, value: 'green' } });
    expect(screen.getByRole('combobox')).toHaveValue('green');
  });

  it('shows error message with error styling', () => {
    render(Select, {
      props: { label: 'Region', options: stringOptions, error: 'Required' },
    });
    const select = screen.getByLabelText('Region');
    const errorMsg = screen.getByText('Required');
    expect(errorMsg.getAttribute('role')).toBe('alert');
    expect(select.className).toContain('border-desktop-error');
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows description text and hides it when error is present', () => {
    render(Select, {
      props: { label: 'Region', options: stringOptions, description: 'Pick one' },
    });
    expect(screen.getByText('Pick one')).toBeDefined();

    // Re-render with error — description hidden
    render(Select, {
      props: {
        label: 'Region 2',
        options: stringOptions,
        description: 'Hidden',
        error: 'Required',
      },
    });
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.getByText('Required')).toBeDefined();
  });

  it('applies disabled state', () => {
    render(Select, { props: { options: stringOptions, disabled: true } });
    const select = screen.getByRole('combobox');
    expect(select.hasAttribute('disabled')).toBe(true);
    expect(select.className).toContain('cursor-not-allowed');
  });

  it('applies size variants', () => {
    render(Select, { props: { options: stringOptions, size: 'lg' } });
    const select = screen.getByRole('combobox');
    expect(select.className).toContain('text-desktop-lg');
  });

  it('generates auto ID from label', () => {
    render(Select, { props: { label: 'My Field', options: stringOptions } });
    expect(screen.getByLabelText('My Field').getAttribute('id')).toBe(
      'select-my-field'
    );
  });

  it('uses custom id when provided', () => {
    render(Select, { props: { id: 'custom-id', label: 'Field', options: stringOptions } });
    expect(screen.getByLabelText('Field').getAttribute('id')).toBe('custom-id');
  });

  it('fires onchange when user selects an option', async () => {
    const user = userEvent.setup();
    let changed: string | null = null;
    render(Select, {
      props: {
        options: stringOptions,
        onchange: (e: Event) => {
          changed = (e.target as HTMLSelectElement).value;
        },
      },
    });
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'blue');
    expect(changed).toBe('blue');
  });
});
