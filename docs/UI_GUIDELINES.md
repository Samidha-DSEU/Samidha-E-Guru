# UI_GUIDELINES.md — Design System & UI/UX Standards

The visual design language of **SAMIDHA E-GURU** follows Apple and Linear aesthetics: high whitespace, minimal borders, subtle shadows, crisp typography, and calm color palettes.

---

## 🎨 Color Palette & CSS Tokens

```css
:root {
  /* Canvas Backgrounds */
  --bg-primary: #fcfcfc;
  --bg-secondary: #f4f4f5;
  --bg-card: #ffffff;
  
  /* Text Colors */
  --text-primary: #09090b;
  --text-secondary: #71717a;
  --text-muted: #a1a1aa;

  /* Accent & Status Colors */
  --brand-blue: #0284c7;
  --brand-blue-hover: #0369a1;
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-danger: #ef4444;

  /* Borders & Shadows */
  --border-subtle: #e4e4e7;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --radius-lg: 12px;
  --radius-xl: 16px;
}

.dark {
  --bg-primary: #09090b;
  --bg-secondary: #18181b;
  --bg-card: #121215;
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --border-subtle: #27272a;
}
```

---

## 📏 Typography & Spacing System
- **Font Family**: Geist / Inter Sans-Serif.
- **Base Grid**: 8px (8px, 16px, 24px, 32px, 48px, 64px).
- **Whitespace Rule**: Prioritize breathing room over compact data density.

---

## 🧱 Component State Rules

Every UI component that fetches data MUST implement 4 distinct visual states:

1. **Loading State**: Clean, subtle skeleton pulse UI (`<Skeleton className="h-6 w-3/4" />`).
2. **Success State**: Smooth transition of actual content.
3. **Empty State**: Friendly illustration/icon, clear title, concise description, and CTA button.
4. **Error State**: Non-intrusive alert box with retry button (`<Button onClick={refetch}>Try Again</Button>`).

---

## ♿ Accessibility Guidelines
- **Contrast**: Minimum 4.5:1 ratio for text.
- **Focus States**: Visible outline ring on keypress (`focus-visible:ring-2 focus-visible:ring-sky-500`).
- **Semantic HTML**: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`.
- **ARIA Attributes**: `aria-expanded`, `aria-label`, `aria-controls` on modal and drawer components.
