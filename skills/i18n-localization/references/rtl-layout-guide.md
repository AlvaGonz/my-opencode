# RTL Layout Guide — CSS, HTML, and Testing

> Sources:
> - [Next.js Internationalization](https://nextjs.org/docs/app/guides/internationalization)
> - [W3C Internationalization](https://www.w3.org/International/questions/qa-html-dir)
> - [MDN CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)

---

## HTML Foundation

### Set `dir` on `<html>`

```html
<!-- LTR (default) -->
<html lang="en" dir="ltr">

<!-- RTL -->
<html lang="ar" dir="rtl">
```

In Next.js with dynamic locale:

```tsx
// app/[lang]/layout.tsx
export default async function RootLayout({
  children, params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
```

### CSS `:dir()` selector

Use `:dir(rtl)` for RTL-specific overrides (broader support than `[dir="rtl"]`):

```css
.card:dir(rtl) {
  text-align: right;
}
```

---

## CSS Logical Properties

Replace physical properties with logical equivalents. The browser swaps them automatically when `dir` changes.

| Physical (Avoid) | Logical (Use) | Effect |
|------------------|---------------|--------|
| `left` | `inset-inline-start` | Start edge (LTR=left, RTL=right) |
| `right` | `inset-inline-end` | End edge (LTR=right, RTL=left) |
| `margin-left` | `margin-inline-start` | Margin on start side |
| `margin-right` | `margin-inline-end` | Margin on end side |
| `padding-left` | `padding-inline-start` | Padding on start side |
| `padding-right` | `padding-inline-end` | Padding on end side |
| `border-left` | `border-inline-start` | Border on start side |
| `border-right` | `border-inline-end` | Border on end side |
| `text-align: left` | `text-align: start` | Start-aligned text |
| `text-align: right` | `text-align: end` | End-aligned text |

### Block vs Inline

| Property | Block Axis (vertical in LTR/RTL) | Inline Axis (horizontal in LTR/RTL) |
|----------|----------------------------------|-------------------------------------|
| Size | `block-size` (height) | `inline-size` (width) |
| Min | `min-block-size` | `min-inline-size` |
| Max | `max-block-size` | `max-inline-size` |
| Start | `inset-block-start` (top) | `inset-inline-start` |
| End | `inset-block-end` (bottom) | `inset-inline-end` |
| Margin | `margin-block` / `margin-block-start` | `margin-inline` / `margin-inline-start` |
| Padding | `padding-block` / `padding-block-start` | `padding-inline` / `padding-inline-start` |
| Border | `border-block` / `border-block-start` | `border-inline` / `border-inline-start` |

### Example: Card component

```css
/* ❌ Physical — breaks in RTL */
.card {
  padding-left: 16px;
  margin-right: 8px;
  border-left: 2px solid blue;
  text-align: left;
}

/* ✅ Logical — works in both directions */
.card {
  padding-inline-start: 16px;
  margin-inline-end: 8px;
  border-inline-start: 2px solid blue;
  text-align: start;
}
```

---

## Flexbox & Grid

### Flexbox

Flexbox respects `dir` automatically:

```css
/* In LTR: items flow left → right */
/* In RTL: items flow right → left */
.flex-row {
  display: flex;
  flex-direction: row;
}

/* Manual override if needed */
.flex-row {
  display: flex;
  flex-direction: row;
}

/* RTL override for specific alignment */
.container:dir(rtl) {
  justify-content: flex-start; /* swaps because main axis flips */
}
```

**`margin-left: auto`** in flexbox is commonly used for push-right. Replace with `margin-inline-start: auto`:

```css
/* ❌ Physical */
.push-right {
  margin-left: auto;
}

/* ✅ Logical */
.push-end {
  margin-inline-start: auto;
}
```

### Grid

CSS Grid areas and lines automatically mirror in RTL:

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
}

/* Line-based placement mirrors automatically */
.item {
  grid-column: 1 / 3;
  /* In LTR: spans columns 1-2 */
  /* In RTL: spans columns 1-2 from right */
}
```

**Caution:** Named grid areas do NOT automatically mirror:

```css
/* ❌ This does NOT swap in RTL */
.grid {
  grid-template-areas: "sidebar content aside";
}

/* ✅ Use logical properties or explicit RTL override */
.grid:dir(ltr) {
  grid-template-areas: "sidebar content aside";
}
.grid:dir(rtl) {
  grid-template-areas: "aside content sidebar";
}
```

---

## Icon & Image Mirroring

Icons that imply direction (arrows, chevrons, back/forward) should be mirrored in RTL:

```css
/* Mirror icons that indicate direction */
.icon-arrow-right:dir(rtl),
.icon-chevron-left:dir(rtl),
.icon-back:dir(rtl) {
  transform: scaleX(-1);
}
```

**Icons that should NOT mirror:**
- Play/pause buttons
- Volume controls
- Logos and brand marks
- Phone, email, social media icons
- Loading spinners (animate in both directions)

### SVG inline with `dir`

```tsx
// React component — flips automatically if dir is on <html>
<svg
  viewBox="0 0 24 24"
  className="icon-arrow"
  // For standalone SVGs not inheriting dir:
  style={{ transform: lang === 'ar' ? 'scaleX(-1)' : undefined }}
>
  <path d="..." />
</svg>
```

---

## Form & Input Considerations

### Input fields

Input `type="text"` automatically respects `dir`. For mixed content (e.g., English text in Arabic form):

```html
<input type="text" dir="auto" />
```

`dir="auto"` lets the browser detect direction based on the first strong character.

### Form layout

```css
/* Logical layout for forms */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  text-align: start; /* instead of left */
}

.form-actions {
  display: flex;
  justify-content: flex-end; /* buttons align to end in both LTR/RTL */
  gap: 8px;
}
```

---

## Testing RTL in Next.js

### 1. Quick browser check

Add `?lang=ar` to URL or toggle locale via locale switcher. Verify:

- [ ] Page content reads right-to-left
- [ ] All text is right-aligned
- [ ] Navigation order is mirrored
- [ ] Icons with direction are flipped
- [ ] Form inputs accept LTR text correctly within RTL layout
- [ ] Dropdown/select menus appear on correct side
- [ ] Modals/dialogs open in correct position
- [ ] Scroll position starts at right edge

### 2. Cypress / Playwright test

```typescript
// Playwright RTL test
test.describe("RTL layout", () => {
  test("Arabic page renders correctly", async ({ page }) => {
    await page.goto("/ar/products");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Check text alignment
    const mainHeading = page.locator("h1");
    await expect(mainHeading).toHaveCSS("text-align", "start");

    // Check navigation order (visual)
    const nav = page.locator("nav");
    await expect(nav).toHaveCSS("direction", "rtl");

    // Screenshot comparison
    await page.screenshot({ path: "rtl-arabic.png", fullPage: true });
  });
});
```

### 3. Visual regression testing

Set up Percy/Chromatic snapshots per locale:

```typescript
// Cypress + Percy
const locales = ["en", "es", "fr", "ar"];

locales.forEach((locale) => {
  it(`renders ${locale} homepage`, () => {
    cy.visit(`/${locale}`);
    cy.percySnapshot(`homepage-${locale}`, {
      widths: [375, 768, 1280],
    });
  });
});
```

### 4. Common RTL bugs checklist

| Issue | Fix |
|-------|-----|
| Text still left-aligned | Replace `text-align: left` with `text-align: start` |
| Margins reversed | Replace `margin-left/right` with `margin-inline-start/end` |
| Background position wrong | Use `background-position: left` → `background-position: start` |
| Overflow scroll starts at left | Set `overflow-x` container direction |
| Absolute positioned elements wrong | Use `inset-inline-start/end` instead of `left/right` |
| Dropdown menus flip to wrong side | Use `inset-inline-start: 0; inset-inline-end: auto` |
| Border radius on wrong corner | Replace `border-radius: 8px 0 0 8px` with logical approach |
| Table columns reversed | Apply `direction: rtl` on `<table>` |
| Float breaks layout | Replace `float: left/right` with flexbox or grid |

---

## CSS Custom Properties for RTL

Define RTL-aware custom properties:

```css
:root {
  --space-inline: margin-inline;
  --space-inline-start: margin-inline-start;
  --space-inline-end: margin-inline-end;
  --padding-inline: padding-inline;
  --border-inline-start: border-inline-start;
}

/* Use in components */
.card {
  margin: var(--space-inline-start) 0;
  padding: var(--padding-inline);
}
```

---

## Resources

- MDN: [CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- W3C: [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)
- RTL Styling 101: [RTL Styling 101](https://rtlstyling.com/)
- Next.js: [Internationalized Routing](https://nextjs.org/docs/app/guides/internationalization)
