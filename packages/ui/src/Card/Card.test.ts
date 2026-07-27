/**
 * Card — O1 Design System
 *
 * Tests for the Card component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Card from './Card.svelte';

describe('Card', () => {
  it('renders with default variant', () => {
    const { container } = render(Card, { props: { children: 'Content' } });
    const card = container.querySelector('div');
    expect(card!.className).toContain('bg-desktop-surface');
    expect(card!.className).toContain('border');
  });

  it('renders with elevated variant', () => {
    const { container } = render(Card, {
      props: { children: 'Elevated', variant: 'elevated' }
    });
    const card = container.querySelector('div');
    expect(card!.className).toContain('shadow-lg');
  });

  it('renders with bordered variant', () => {
    const { container } = render(Card, {
      props: { children: 'Bordered', variant: 'bordered' }
    });
    const card = container.querySelector('div');
    expect(card!.className).toContain('bg-transparent');
    expect(card!.className).toContain('border');
  });

  it('renders with ghost variant', () => {
    const { container } = render(Card, {
      props: { children: 'Ghost', variant: 'ghost' }
    });
    const card = container.querySelector('div');
    expect(card!.className).toContain('bg-transparent');
    expect(card!.className).toContain('border-transparent');
  });

  it('renders children content', () => {
    render(Card, { props: { children: 'Hello World' } });
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('renders header and footer as strings', () => {
    render(Card, {
      props: {
        header: 'Header Content',
        children: 'Body',
        footer: 'Footer Content',
      }
    });
    expect(screen.getByText('Header Content')).toBeDefined();
    expect(screen.getByText('Body')).toBeDefined();
    expect(screen.getByText('Footer Content')).toBeDefined();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(Card, {
      props: { children: 'Clickable', onclick: () => { clicked = true; } }
    });
    const card = screen.getByRole('button');
    await user.click(card);
    expect(clicked).toBe(true);
  });

  it('applies role="button" when onclick is provided', () => {
    render(Card, {
      props: { children: 'Clickable', onclick: () => {} }
    });
    const card = screen.getByRole('button');
    expect(card).toBeDefined();
  });
});
