# Design System Document: The Culinary Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Heritage Curator"**

This design system moves away from the sterile, transactional nature of traditional e-commerce. It is built to feel like a high-end interior design journal—warm, authoritative, and intentionally paced. We achieve this by balancing the "established" weight of **Noto Serif** with the modern utility of **Manrope**. 

To move beyond a "template" look, we utilize **Intentional Asymmetry**. Rather than perfectly centered grids, we use generous, offset whitespace and overlapping "layered" surfaces. This creates a digital environment that feels curated and tactile, mirroring the physical experience of a premium kitchen.

---

## 2. Colors: Tonal Depth & Warmth
The palette is grounded in "Heart of the Home" warmth. We avoid stark whites in favor of creams and utilize deep botanical greens and earthen terracottas to provide a sense of organic luxury.

### Core Palette
*   **Primary (`#173124`):** Deep Forest. Used for primary CTAs and brand-defining moments.
*   **Secondary (`#904b36`):** Warm Terracotta. Used for accents, notifications, or "Special Edition" product callouts.
*   **Surface (`#fcf9f4`):** The "Cream Base." This is the canvas of the store.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined through background color shifts. 
*   *Example:* A product description section should transition from `surface` to `surface-container-low` to define its bounds, rather than using a divider line.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
*   **Level 0:** `surface` (The base floor)
*   **Level 1:** `surface-container-low` (Subtle inset areas)
*   **Level 2:** `surface-container` (Standard cards)
*   **Level 3:** `surface-container-highest` (Floating elements/Modals)

### The "Glass & Gradient" Rule
To add soul to the UI, use subtle linear gradients on CTAs: `primary` to `primary-container`. For floating navigation or product filters, apply **Glassmorphism**: use `surface` at 80% opacity with a `20px` backdrop-blur to allow product imagery to bleed through softly.

---

## 3. Typography: Editorial Authority
We pair an elegant serif for storytelling with a high-readability sans-serif for commerce.

*   **Display & Headlines (Noto Serif):** Used for "Editorial Moments"—hero titles, collection names, and product titles. It conveys trust and tradition.
    *   *Scale:* `display-lg` (3.5rem) down to `headline-sm` (1.5rem).
*   **Body & UI (Manrope):** A geometric sans-serif used for descriptions, price points, and navigation. It ensures the interface feels modern and functional.
    *   *Scale:* `body-lg` (1rem) for descriptions; `label-md` (0.75rem) for technical specs.

---

## 4. Elevation & Depth
In this system, depth is felt, not seen. We favor **Tonal Layering** over traditional drop shadows.

*   **The Layering Principle:** Achieve lift by stacking tokens. Place a `surface-container-lowest` card (Pure White) on top of a `surface-container` background. The slight shift in "creaminess" creates a natural, soft-touch elevation.
*   **Ambient Shadows:** Use only for high-priority floating elements (e.g., a "Cart" drawer). Shadows must be:
    *   *Color:* A 10% opacity tint of `on-surface` (never pure grey).
    *   *Blur:* Minimum `32px` to ensure a soft, ambient glow.
*   **The "Ghost Border":** If a boundary is required for accessibility, use the `outline-variant` token at **15% opacity**. High-contrast borders are strictly forbidden.

---

## 5. Components

### Buttons: The "Soft-Tactile" Interaction
*   **Primary:** `primary` background with `on-primary` text. Use `md` (12px) rounded corners. Apply a subtle inner-glow gradient to suggest a slightly domed surface.
*   **Secondary:** `surface-container-highest` background. No border. This creates a "flush" button that feels integrated into the page.
*   **States:** On hover, shift the background to the `fixed-dim` variant of the color (e.g., `primary_fixed_dim`) to create a "pressed" or "lit" effect.

### Input Fields & Search
*   **Style:** Minimalist. No bottom line or full border. Use a `surface-container-low` fill with `8px` rounded corners.
*   **Focus:** Transition the background to `surface-container-highest` and add a "Ghost Border" of the `primary` color at 20% opacity.

### Product Cards & Lists
*   **Layout:** Strictly no dividers. Use `spacing-xl` (the 24px-32px range) to separate items.
*   **Imagery:** Images should utilize `lg` (16px) corner radius to feel friendly and approachable.
*   **Admin Data Tables:** To maintain the "Editorial" feel, table headers should use `label-md` in all-caps with 0.05em letter spacing. Rows should alternate between `surface` and `surface-container-lowest` rather than using grid lines.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Whitespace:** If a layout feels "busy," increase the vertical padding. Product images need room to breathe.
*   **Use Asymmetrical Grids:** For collection pages, vary the sizes of product images (e.g., one large "feature" image next to two smaller ones) to mimic a magazine layout.
*   **Color Transitions:** Use `surface-tint` sparingly to highlight active navigation states or small "New" badges.

### Don't:
*   **Don't use 100% Black:** Always use `on-surface` (`#1c1c19`) for typography. Pure black is too harsh for the "warm heart" aesthetic.
*   **Don't use sharp corners:** Never use `none` (0px) roundedness. Even for high-end items, sharp corners feel aggressive. Use a minimum of `sm` (4px) for small UI elements.
*   **Don't use standard Dividers:** If you feel the need to separate content, ask: "Can I do this with a 5% color shift or 40px of whitespace instead?"