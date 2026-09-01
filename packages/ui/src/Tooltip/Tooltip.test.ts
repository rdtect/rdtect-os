/**
 * Tooltip — O1 Design System
 *
 * Tests for the Tooltip component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Tooltip from './Tooltip.svelte';

describe('Tooltip', () => {
  it('renders trigger content', () => {
    render(Tooltip, { props: { text: 'Help', children: 'Hover me' } });
    expect(screen.getByText('Hover me')).toBeDefined();
  });

  it('renders tooltip text with role="tooltip"', () => {
    render(Tooltip, { props: { text: 'Save changes', children: 'Save' } });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toBe('Save changes');
  });

  it('wires aria-describedby from trigger to tooltip', () => {
    const { container } = render(Tooltip, {
      props: { text: 'Save changes', children: 'Save' },
    });
    const wrapper = container.firstElementChild as HTMLElement;
    const descId = wrapper.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    const tooltip = document.getElementById(descId!);
    expect(tooltip).not.toBeNull();
    expect(tooltip!.getAttribute('role')).toBe('tooltip');
  });

  it('applies top position classes by default', () => {
    const { container } = render(Tooltip, { props: { text: 'Tip', children: 'x' } });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('bottom-full');
    expect(tooltip.className).toContain('mb-1.5');
    expect(container.firstElementChild!.className).toContain('group');
  });

  it('applies custom positions', () => {
    render(Tooltip, {
      props: { text: 'Right', children: 'x', position: 'right' },
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('left-full');
    expect(tooltip.className).toContain('ml-1.5');
  });

  it('makes the wrapper focusable by default', () => {
    const { container } = render(Tooltip, { props: { text: 'Tip', children: 'x' } });
    expect(container.firstElementChild!.getAttribute('tabindex')).toBe('0');
  });

  it('skips wrapper tabindex when interactive', () => {
    const { container } = render(Tooltip, {
      props: { text: 'Tip', children: 'x', interactive: true },
    });
    expect(container.firstElementChild!.hasAttribute('tabindex')).toBe(false);
  });

  it('removes tooltip and aria wiring when disabled', () => {
    const { container } = render(Tooltip, {
      props: { text: 'Gone', children: 'x', disabled: true },
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(container.firstElementChild!.hasAttribute('aria-describedby')).toBe(
      false
    );
  });

  it('uses explicit id when provided', () => {
    const { container } = render(Tooltip, {
      props: { text: 'Custom', children: 'x', id: 'my-tip' },
    });
    expect(container.firstElementChild!.getAttribute('aria-describedby')).toBe(
      'my-tip'
    );
    expect(screen.getByRole('tooltip').getAttribute('id')).toBe('my-tip');
  });

  it('auto-generates a stable id from text', () => {
    render(Tooltip, { props: { text: 'Save Changes!', children: 'x' } });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.getAttribute('id')).toBe('tooltip-save-changes');
  });

  it('applies extra wrapper classes', () => {
    const { container } = render(Tooltip, {
      props: { text: 'Tip', children: 'x', class: 'ml-2' },
    });
    expect(container.firstElementChild!.className).toContain('ml-2');
  });
});
