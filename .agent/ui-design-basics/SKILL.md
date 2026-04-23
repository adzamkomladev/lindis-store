---
name: ui-design-basics
description: >-
  Practical UI design principles from Refactoring UI.
  Load when designing interfaces, layouts, or visual components.
---

# UI Design Basics

Practical design principles for building beautiful interfaces.

> **Announce:** "I'm loading ui-design-basics context for design decisions."

## Core Philosophy

- **Start with a feature, not a layout** - Design actual functionality first, not the shell
- **Detail comes later** - Don't obsess over fonts and shadows early on
- **Design in grayscale first** - Forces good hierarchy before adding color
- **Limit your choices** - Use predefined systems to speed up decisions

## Visual Hierarchy

### The Key Principle

Not all elements are equal. De-emphasize secondary content to make primary content stand out.

### Hierarchy Tools (Beyond Font Size)

| Tool | Primary Content | Secondary Content | Tertiary Content |
|------|----------------|-------------------|------------------|
| **Color** | Dark (high contrast) | Grey (medium) | Light grey (low) |
| **Weight** | 600-700 (bold) | 400-500 (normal) | 400 (normal) |
| **Size** | Large | Medium | Small |

### Font Weight Rules

- Use **two weights max** for UI: 400/500 (normal) and 600/700 (bold)
- **Never use weights under 400** - too hard to read at small sizes
- To de-emphasize: use lighter color or smaller size, NOT lighter weight

### Color Text on Backgrounds

- **Don't use grey text on colored backgrounds** - it looks washed out
- Instead: Pick a color with same hue, adjust saturation/lightness
- Hand-pick colors rather than reducing opacity

### Labels Are a Last Resort

```
❌ Label: Value Format
   Email: jane@example.com
   Phone: (555) 123-4567

✅ Format Speaks for Itself
   jane@example.com
   (555) 123-4567
```

- Combine labels and values: "12 left in stock" instead of "In stock: 12"
- When labels needed: make them secondary (smaller, lighter, less bold)

## Layout & Spacing

### White Space

- **Start with too much** - then remove until it looks right
- White space should be removed, not added
- Denser UIs have their place (dashboards) but make it deliberate

### Spacing System

Use a constrained scale with ~25% jumps between values:

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
```

- Base: 16px (browser default font size)
- Process: Try a value → compare with neighbors → pick best

### Don't Fill the Screen

- If you need 600px, use 600px - don't stretch to fill
- Try columns instead of wider single areas
- Give elements only the space they need

### Avoid Ambiguous Spacing

Groups should be clearly connected:
- More space **between** groups
- Less space **within** groups

```
❌ Equal spacing everywhere
   [Label]     [Input]     [Label]     [Input]
   
✅ Clear grouping
   [Label][Input]          [Label][Input]
```

## Typography

### Type Scale

Don't pick arbitrary sizes. Define a scale:

```
12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px, 60px, 72px
```

- Use **px or rem**, never em (prevents cascade issues)
- Modular scales (4:5 ratio) can work but hand-crafted scales are more practical

### Line Length

- **45-75 characters per line** for comfortable reading
- Use `max-width: 20-35em` for paragraphs
- Wider content areas ≠ wider paragraphs

### Line Height

| Content Type | Line Height |
|--------------|-------------|
| Small text / Long lines | 1.75-2 |
| Body copy | 1.5-1.6 |
| Large headlines | 1-1.25 |

**Rule:** Line-height and font size are inversely proportional.

### Text Alignment

- **Left-align** most text (matches reading direction)
- **Center-align** only short blocks (< 2-3 lines)
- **Right-align** numbers in tables

### Letter Spacing

- Tighten for headlines (especially if using a wide-spaced font)
- Increase for ALL-CAPS text (improves readability)

## Color

### Use HSL, Not Hex

- **Hue** (0-360°): Position on color wheel
- **Saturation** (0-100%): How colorful
- **Lightness** (0-100%): How light/dark

### Color Palette Structure

| Category | Shades | Purpose |
|----------|--------|---------|
| **Greys** | 8-10 | Text, backgrounds, borders |
| **Primary** | 5-10 | Brand, buttons, links |
| **Accent** | 5-10 each | Semantic states, highlights |

### Building Shade Scales

1. Pick base color (500) - good for button backgrounds
2. Pick darkest (900) - for text on light backgrounds
3. Pick lightest (100) - for tinted backgrounds
4. Fill gaps: 700, 300 first, then 800, 600, 400, 200

### Saturation at Extremes

As lightness approaches 0% or 100%, **increase saturation** to prevent washed-out colors.

### Perceived Brightness

Different hues have different perceived brightness:
- **Bright:** Yellow (60°), Cyan (180°), Magenta (300°)
- **Dark:** Red (0°), Green (120°), Blue (240°)

**Tip:** Rotate hue toward bright colors to lighten, toward dark colors to darken.

### Warm/Cool Greys

- **Cool greys:** Saturate with blue
- **Warm greys:** Saturate with yellow/orange

### Accessibility

- Minimum contrast ratio: **4.5:1** (normal text), **3:1** (large text)
- Flip the contrast: Use dark text on light colored backgrounds
- Don't rely on color alone - add icons/text for colorblind users

## Creating Depth

### Emulate Light Source

Light comes from above:
- **Raised elements:** Light top edge, shadow below
- **Inset elements:** Shadow at top, light bottom edge

### Shadow System

Define 5 shadow levels:

```css
/* Subtle - buttons */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* Medium - dropdowns */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Large - modals */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Two-Part Shadows

Combine shadows for realistic depth:
1. **Large, soft** - simulates direct light
2. **Small, tight** - ambient shadow underneath

### Flat Design Depth

- Lighter = closer, darker = further
- Use solid shadows (no blur) for flat aesthetic
- Overlap elements to create layers

## Images

### Text Over Images

- Add semi-transparent overlay (dark or light)
- Lower image contrast
- Colorize with single color
- Add subtle text shadow (large blur, no offset)

### Scaling Rules

- **Don't scale up icons** - they get chunky
- **Don't scale down screenshots** - text becomes unreadable
- Redraw icons at target size for favicons

### User-Uploaded Content

- Use fixed containers with `object-fit: cover`
- Add subtle inner shadow to prevent background bleed

## Finishing Touches

### Supercharge Defaults

- Replace bullets with icons (checkmarks, arrows)
- Make quote marks visual elements
- Custom styled checkboxes/radios

### Accent Borders

Add colorful borders to:
- Top of cards
- Active navigation items
- Side of alerts
- Under headlines

### Background Decoration

- Change background color between sections
- Use subtle gradients (< 30° hue difference)
- Add repeating patterns (low contrast)
- Include simple geometric shapes

### Empty States

- Don't leave them plain
- Add illustrations or images
- Emphasize the call-to-action
- Hide unused UI (filters, tabs)

### Use Fewer Borders

Alternatives to borders:
- **Box shadows** - more subtle
- **Different background colors** - clear separation
- **Extra spacing** - simplest approach

## Button Hierarchy

| Level | Style | Use Case |
|-------|-------|----------|
| Primary | Solid, high contrast | Main action |
| Secondary | Outline or low contrast | Alternative actions |
| Tertiary | Link style | Seldom used actions |

**Destructive actions:** Use secondary styling + confirmation step with primary styling.

## When Stuck

For comprehensive details on any topic above, read the full reference:

**Full Reference:** [refactoringui.md](./refactoringui.md)

This file contains the complete Refactoring UI book content with detailed explanations, examples, and the reasoning behind each principle.

## Reference

- Full source: `refactoringui.md` (in this skill folder)
- Based on *Refactoring UI* by Adam Wathan & Steve Schoger
