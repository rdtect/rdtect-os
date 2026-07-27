/**
 * Input — O1 Design System
 *
 * Tests for the Input component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Input from './Input.svelte';

describe('Input', () => {
  it('renders a text input by default', () => {
    render(Input);
    const input = screen.getByRole('textbox');
    expect(input).toBeDefined();
  });

  it('renders with label', () => {
    render(Input, { props: { label: 'Username' } });
    const input = screen.getByLabelText('Username');
    expect(input).toBeDefined();
  });

  it('renders with placeholder', () => {
    render(Input, { props: { placeholder: 'Enter text...' } });
    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toBeDefined();
  });

  it('renders with initial value', () => {
    render(Input, { props: { value: 'hello' } });
    const input = screen.getByDisplayValue('hello');
    expect(input).toBeDefined();
  });

  it('shows error message with error styling', () => {
    render(Input, { props: { label: 'Email', error: 'Invalid email' } });
    const input = screen.getByLabelText('Email');
    const errorMsg = screen.getByText('Invalid email');
    expect(errorMsg).toBeDefined();
    expect(errorMsg.getAttribute('role')).toBe('alert');
    // Input should have error styling
    expect(input.className).toContain('border-desktop-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows description text', () => {
    render(Input, { props: { label: 'Bio', description: 'Tell us about yourself' } });
    const desc = screen.getByText('Tell us about yourself');
    expect(desc).toBeDefined();
  });

  it('hides description when error is present', () => {
    render(Input, {
      props: { label: 'Bio', description: 'Tell us about yourself', error: 'Required' }
    });
    expect(screen.queryByText('Tell us about yourself')).toBeNull();
    expect(screen.getByText('Required')).toBeDefined();
  });

  it('shows required indicator on label', () => {
    render(Input, { props: { label: 'Name', required: true } });
    const label = screen.getByText('Name');
    expect(label.innerHTML).toContain('*');
  });

  it('applies disabled state', () => {
    render(Input, { props: { label: 'Disabled', disabled: true } });
    const input = screen.getByLabelText('Disabled');
    expect(input.hasAttribute('disabled')).toBe(true);
    expect(input.className).toContain('cursor-not-allowed');
  });

  it('updates value on input event', async () => {
    const user = userEvent.setup();
    render(Input, { props: { label: 'Search' } });
    const input = screen.getByLabelText('Search');
    await user.type(input, 'test');
    expect(input).toHaveValue('test');
  });

  it('renders with icon', () => {
    const { container } = render(Input, { props: { icon: '🔍' } });
    const iconSpan = container.querySelector('[aria-hidden="true"]');
    expect(iconSpan).toBeDefined();
    expect(iconSpan!.textContent).toBe('🔍');
  });

  it('applies size variants', () => {
    render(Input, { props: { label: 'Big', size: 'lg' } });
    const input = screen.getByLabelText('Big');
    expect(input.className).toContain('text-desktop-lg');
  });

  it('generates auto ID from label', () => {
    render(Input, { props: { label: 'My Field' } });
    const input = screen.getByLabelText('My Field');
    expect(input.getAttribute('id')).toBe('input-my-field');
  });

  it('uses custom id when provided', () => {
    render(Input, { props: { id: 'custom-id', label: 'Field' } });
    const input = screen.getByLabelText('Field');
    expect(input.getAttribute('id')).toBe('custom-id');
  });
});
