/**
 * Toggle — O1 Design System
 *
 * Tests for the Toggle (switch) component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Toggle from './Toggle.svelte';

describe('Toggle', () => {
  it('renders a switch with aria-checked=false by default', () => {
    render(Toggle, { props: { label: 'Dark mode' } });
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDefined();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('reflects checked state via aria-checked', () => {
    render(Toggle, { props: { label: 'Dark mode', checked: true } });
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('renders the label and wires aria-label', () => {
    render(Toggle, { props: { label: 'Notifications' } });
    expect(screen.getByText('Notifications')).toBeDefined();
    expect(screen.getByRole('switch').getAttribute('aria-label')).toBe(
      'Notifications'
    );
  });

  it('renders description with aria-describedby', () => {
    render(Toggle, {
      props: { label: 'Beta', description: 'Show experimental features' },
    });
    expect(screen.getByText('Show experimental features')).toBeDefined();
    const toggle = screen.getByRole('switch');
    const descId = toggle.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)!.textContent).toContain(
      'Show experimental features'
    );
  });

  it('applies checked accent color and knob offset', () => {
    const { container } = render(Toggle, { props: { checked: true } });
    const button = container.querySelector('[role="switch"]')!;
    const knob = button.querySelector('span')!;
    expect(button.className).toContain('bg-desktop-accent');
    expect(knob.className).toContain('translate-x-5');
  });

  it('keeps knob at rest position when unchecked', () => {
    const { container } = render(Toggle);
    const button = container.querySelector('[role="switch"]')!;
    const knob = button.querySelector('span')!;
    expect(button.className).toContain('bg-desktop-subtle');
    expect(knob.className).toContain('translate-x-0');
  });

  it('applies size variants', () => {
    const { container } = render(Toggle, { props: { size: 'sm' } });
    const button = container.querySelector('[role="switch"]')!;
    expect(button.className).toContain('w-8 h-4');
  });

  it('fires onchange on click', async () => {
    const user = userEvent.setup();
    let fired = false;
    render(Toggle, { props: { label: 'Sounds', onchange: () => { fired = true; } } });
    await user.click(screen.getByRole('switch'));
    expect(fired).toBe(true);
  });

  it('does not fire onchange when disabled', async () => {
    const user = userEvent.setup();
    let fired = false;
    render(Toggle, {
      props: { label: 'Sounds', disabled: true, onchange: () => { fired = true; } },
    });
    const toggle = screen.getByRole('switch');
    expect(toggle.hasAttribute('disabled')).toBe(true);
    await user.click(toggle);
    expect(fired).toBe(false);
  });

  it('supports keyboard toggle via Enter', async () => {
    const user = userEvent.setup();
    let fired = false;
    render(Toggle, { props: { label: 'Sync', onchange: () => { fired = true; } } });
    const toggle = screen.getByRole('switch');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(fired).toBe(true);
  });

  it('generates auto ID from label', () => {
    render(Toggle, { props: { label: 'My Switch' } });
    expect(screen.getByRole('switch').getAttribute('id')).toBe(
      'toggle-my-switch'
    );
  });

  it('uses custom id when provided', () => {
    render(Toggle, { props: { id: 'custom-id', label: 'Field' } });
    expect(screen.getByRole('switch').getAttribute('id')).toBe('custom-id');
  });
});
