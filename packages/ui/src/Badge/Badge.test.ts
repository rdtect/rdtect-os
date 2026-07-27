/**
 * Badge — O1 Design System
 *
 * Tests for the Badge component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Badge from './Badge.svelte';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(Badge, { props: { children: 'Default' } });
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-desktop-surface');
  });

  it('renders with accent variant', () => {
    render(Badge, { props: { children: 'Accent', variant: 'accent' } });
    const badge = screen.getByText('Accent');
    expect(badge.className).toContain('bg-desktop-accent');
  });

  it('renders with success variant', () => {
    render(Badge, { props: { children: 'Success', variant: 'success' } });
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('text-green-400');
  });

  it('renders with warning variant', () => {
    render(Badge, { props: { children: 'Warning', variant: 'warning' } });
    const badge = screen.getByText('Warning');
    expect(badge.className).toContain('text-amber-400');
  });

  it('renders with error variant', () => {
    render(Badge, { props: { children: 'Error', variant: 'error' } });
    const badge = screen.getByText('Error');
    expect(badge.className).toContain('text-red-400');
  });

  it('renders with info variant', () => {
    render(Badge, { props: { children: 'Info', variant: 'info' } });
    const badge = screen.getByText('Info');
    expect(badge.className).toContain('text-blue-400');
  });

  it('renders as dot indicator when dot=true', () => {
    const { container } = render(Badge, { props: { dot: true, variant: 'accent' } });
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeDefined();
    expect(dot!.className).toContain('w-2');
    expect(dot!.className).toContain('h-2');
    expect(dot!.className).toContain('rounded-full');
    expect(dot!.className).toContain('bg-desktop-accent');
  });

  it('does not render text content when dot=true', () => {
    const { container } = render(Badge, {
      props: { dot: true, children: 'Hidden' }
    });
    expect(screen.queryByText('Hidden')).toBeNull();
  });
});
