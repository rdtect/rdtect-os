# Modern CSS Guide

Learn modern CSS through building Solitaire's UI.

## Table of Contents
1. [CSS Variables](#variables)
2. [Flexbox Layout](#flexbox)
3. [CSS Grid](#grid)
4. [Animations](#animations)
5. [Responsive Design](#responsive)
6. [Advanced Techniques](#advanced)

---

## CSS Variables (Custom Properties) {#variables}

### Why Use Variables?

**Problem:** Repeating magic numbers everywhere
```css
/* ❌ Hard to maintain */
.card { width: 100px; }
.pile { width: 100px; }
.slot { width: 100px; }
/* What if we want to change card width?
```

**Solution:** CSS Variables
```css
/* ✅ Change once, updates everywhere */
:root {
    --card-width: 100px;
}

.card { width: var(--card-width); }
.pile { width: var(--card-width); }
.slot { width: var(--card-width); }
```

### Our Variable System

```css
:root {
    /* Colors - Semantic naming */
    --color-primary: #4CAF50;
    --color-danger: #e74c3c;
    --color-success: #4CAF50;
    
    /* Spacing - T-shirt sizes */
    --spacing-sm: 10px;
    --spacing-md: 20px;
    --spacing-lg: 30px;
    --spacing-xl: 40px;
    
    /* Shadows - Elevation levels */
    --shadow-sm: 0 4px 6px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.3);
    --shadow-lg: 0 6px 12px rgba(0,0,0,0.4);
    
    /* Transitions - Consistent timing */
    --transition-fast: 0.2s;
    --transition-normal: 0.3s;
}
```

### Dynamic Variables

```css
/* Variables can be scoped and overridden */
:root {
    --card-width: 100px;
}

@media (max-width: 768px) {
    :root {
        --card-width: 70px;  /* Smaller on mobile */
    }
}

/* Now ALL cards automatically resize on mobile! */
```

---

## Flexbox Layout {#flexbox}

### The Mental Model

**Think:** Rubber bands stretching items in a line.

```
┌─────────────────────────────────────┐
│  [Item] ←→ [Item] ←→ [Item]        │  ← Main Axis
│     ↕         ↕         ↕            │
└─────────────────────────────────────┘
      ↑ Cross Axis
```

### Our Header Layout

```css
.controls {
    display: flex;
    justify-content: center;  /* Center horizontally */
    align-items: center;      /* Center vertically */
    gap: var(--spacing-md);   /* Space between items */
    flex-wrap: wrap;          /* Wrap on small screens */
}
```

**Result:**
```
[New Game] [Moves: 0] [Time: 0:00] [💡 Hints]
```

On mobile, wraps to:
```
[New Game] [Moves: 0]
[Time: 0:00] [💡 Hints]
```

### Common Flexbox Patterns

```css
/* Center everything */
.center-all {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Space between items */
.space-between {
    display: flex;
    justify-content: space-between;
}

/* Vertical stack */
.stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
```

---

## CSS Grid {#grid}

Not used in this project, but here's how you could use it:

```css
/* Alternative layout for tableau */
.tableau {
    display: grid;
    grid-template-columns: repeat(7, 1fr);  /* 7 equal columns */
    gap: var(--card-gap);
}

/* Responsive grid */
@media (max-width: 768px) {
    .tableau {
        grid-template-columns: repeat(4, 1fr);  /* 4 columns on mobile */
    }
}
```

---

## Animations {#animations}

### Keyframe Animations

**Pattern:** Define once, use many times.

```css
/* 1. Define the animation */
@keyframes slideIn {
    from {
        transform: translateY(-100px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* 2. Apply to element */
.card.dealing {
    animation: slideIn 0.4s ease-out;
}
```

### Our Animations

**Card Deal:**
```css
@keyframes deal {
    0% {
        transform: translateY(-200px) rotate(180deg);
        opacity: 0;
    }
    100% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
}
```

**Invalid Move Shake:**
```css
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.card-pile.drag-over-invalid {
    animation: shake 0.3s;
}
```

### Transitions vs Animations

```css
/* Transition - Simple state change */
.card {
    transition: transform 0.3s;
}
.card:hover {
    transform: translateY(-5px);  /* Smooth lift on hover */
}

/* Animation - Complex, multi-step */
.card.dealing {
    animation: deal 0.4s ease-out;  /* Cards fly in */
}
```

**When to use which?**
- **Transition:** Hover effects, simple state changes
- **Animation:** Loading, complex sequences, keyframe control

---

## Responsive Design {#responsive}

### Mobile-First Approach

**Philosophy:** Start small, enhance for larger screens.

```css
/* Base styles - mobile (320px+) */
.card {
    width: 70px;
    height: 98px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
    .card {
        width: 90px;
        height: 126px;
    }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    .card {
        width: 100px;
        height: 140px;
    }
}
```

### Using CSS Variables

**Cleaner approach:**
```css
:root {
    --card-width: 70px;  /* Mobile default */
}

@media (min-width: 768px) {
    :root {
        --card-width: 100px;  /* Just change variable */
    }
}

/* All cards automatically resize! */
.card { width: var(--card-width); }
.pile { width: var(--card-width); }
```

### Common Breakpoints

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1440px) { }
```

---

## Advanced Techniques {#advanced}

### 1. CSS Logical Properties

**Old way:**
```css
margin-left: 10px;  /* Breaks in RTL languages */
```

**New way:**
```css
margin-inline-start: 10px;  /* Works in RTL too! */
```

### 2. Backdrop Filter

```css
.game-board {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);  /* Glass morphism */
}
```

### 3. CSS Grid for Card Overlap

```css
.tableau-pile {
    display: grid;
    grid-template-rows: repeat(auto-fill, 30px);
}

.tableau-pile .card {
    grid-row: span 5;  /* Overlapping cards */
}
```

### 4. Smooth Scrolling

```css
html {
    scroll-behavior: smooth;
}
```

### 5. Dark Mode

```css
:root {
    --bg-color: white;
    --text-color: black;
}

@media (prefers-color-scheme: dark) {
    :root {
        --bg-color: #1a1a1a;
        --text-color: white;
    }
}

body {
    background: var(--bg-color);
    color: var(--text-color);
}
```

---

## Best Practices

### 1. Naming Conventions

```css
/* BEM (Block Element Modifier) */
.card { }                    /* Block */
.card__title { }            /* Element */
.card--highlighted { }      /* Modifier */

/* Utility Classes */
.text-center { text-align: center; }
.mt-2 { margin-top: 20px; }
```

### 2. Organize CSS

```css
/* 1. Variables */
:root { }

/* 2. Reset/Base */
* { }
body { }

/* 3. Layout */
.container { }
.grid { }

/* 4. Components */
.card { }
.button { }

/* 5. Utilities */
.hidden { }
.text-center { }

/* 6. Media Queries */
@media { }
```

### 3. Performance

```css
/* ✅ GPU Accelerated (Fast) */
transform: translateX(10px);
opacity: 0.5;

/* ❌ Triggers Repaint (Slow) */
left: 10px;
width: 100px;
```

### 4. Accessibility

```css
/* Focus visible for keyboard users */
button:focus-visible {
    outline: 2px solid blue;
    outline-offset: 2px;
}

/* Hide visually, keep for screen readers */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
}
```

---

## Quick Reference

### Flexbox Cheatsheet

```css
/* Container */
display: flex;
flex-direction: row | column;
justify-content: center | space-between | space-around;
align-items: center | flex-start | flex-end;
gap: 10px;

/* Items */
flex: 1;  /* Grow to fill */
flex-shrink: 0;  /* Don't shrink */
order: 1;  /* Change order */
```

### Animation Cheatsheet

```css
/* Transition */
transition: property duration timing-function delay;
transition: all 0.3s ease-in-out 0s;

/* Animation */
animation: name duration timing-function delay iteration-count;
animation: slideIn 0.3s ease-out 0s 1;
```

### Common Patterns

```css
/* Center element */
.center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* Truncate text */
.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Aspect ratio */
.aspect-16-9 {
    aspect-ratio: 16 / 9;
}
```

---

## Exercises

1. **Add dark mode** using `prefers-color-scheme`
2. **Create a flip animation** for cards turning face-up
3. **Add hover effects** to buttons with transitions
4. **Make it responsive** - test on mobile device
5. **Add a new theme** by changing CSS variables

---

## Resources

- [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [CSS Tricks](https://css-tricks.com)
- [Can I Use](https://caniuse.com) - Browser support
- [Flexbox Froggy](https://flexboxfroggy.com) - Learn flexbox
- [Grid Garden](https://cssgridgarden.com) - Learn grid

**Congratulations!** You now understand modern CSS! 🎨
