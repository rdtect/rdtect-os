/**
 * Button — O1 Design System
 *
 * Tests for the Button component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders with default props', () => {
    render(Button, { props: { children: 'Click me' } });
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeDefined();
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('renders with primary variant by default', () => {
    render(Button, { props: { children: 'Primary' } });
    const btn = screen.getByRole('button');
    // Should have the primary variant bg color class
    expect(btn.className).toContain('bg-desktop-accent');
  });

  it('renders with secondary variant', () => {
    render(Button, { props: { children: 'Secondary', variant: 'secondary' } });
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-desktop-surface');
    expect(btn.className).toContain('border');
  });

  it('renders with ghost variant', () => {
    render(Button, { props: { children: 'Ghost', variant: 'ghost' } });
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('hover:bg-desktop-surface');
  });

  it('renders with danger variant', () => {
    render(Button, { props: { children: 'Danger', variant: 'danger' } });
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-desktop-error');
  });

  it('renders with size variants', () => {
    const { container } = render(Button, { props: { children: 'Size', size: 'lg' } });
    const btn = container.querySelector('button');
    expect(btn!.className).toContain('text-desktop-lg');
  });

  it('applies disabled state', () => {
    render(Button, { props: { children: 'Disabled', disabled: true } });
    const btn = screen.getByRole('button');
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.className).toContain('opacity-50');
    expect(btn.className).toContain('cursor-not-allowed');
  });

  it('applies full width class', () => {
    render(Button, { props: { children: 'Full', fullWidth: true } });
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
  });

  it('renders type="submit"', () => {
    render(Button, { props: { children: 'Submit', type: 'submit' } });
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it('calls onclick handler when clicked', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(Button, { props: { children: 'Click', onclick: () => { clicked = true; } } });
    const btn = screen.getByRole('button');
    await user.click(btn);
    expect(clicked).toBe(true);
  });

  it('does not call onclick when disabled', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(Button, {
      props: { children: 'No Click', disabled: true, onclick: () => { clicked = true; } }
    });
    const btn = screen.getByRole('button');
    await user.click(btn);
    expect(clicked).toBe(false);
  });

  it('renders with icon', () => {
    render(Button, { props: { children: 'Icon', icon: '★' } });
    const btn = screen.getByRole('button');
    expect(btn.innerHTML).toContain('★');
  });

  it('renders with iconRight', () => {
    render(Button, { props: { children: 'Right', iconRight: '→' } });
    const btn = screen.getByRole('button');
    expect(btn.innerHTML).toContain('→');
  });
});
