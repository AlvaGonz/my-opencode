---
name: i18n-localization
description: Add internationalization and localization support including string translation, locale-based routing, RTL language support, and pluralization handling.
trigger: "when the user asks to add internationalization, translate strings, set up locale routing, support RTL languages, or handle pluralization"
scope: frontend-i18n
version: "1.0"
sources:
  - https://github.com/i18next/i18next
  - https://github.com/formatjs/formatjs
  - https://github.com/lingui/js-lingui
---

# i18n-Localization Skill

> Internationalization (i18n) is the design and development of products that enables easy localization for target audiences varying in culture, region, or language. This skill covers setup, string extraction, translation management, locale routing, pluralization, and RTL support.

---

## Purpose

Guide the implementation of frontend internationalization and localization using one of three major ecosystems:

| Library | Stars | Bundle | Approach |
|---------|-------|--------|----------|
| **i18next** | 8.6k | ~6 KB | Runtime `t()` calls, JSON resource files, plugin-based |
| **FormatJS (react-intl)** | 14.7k | ~various | ICU MessageFormat, declarative components, polyfills |
| **LinguiJS** | 5.8k | ~2 KB core | Extracts strings via CLI, compiles to minimal runtime, ICU-based |

### When To Use Which

- **i18next**: You need a mature, framework-agnostic solution with backend loading, caching, and language detection.
- **FormatJS / react-intl**: You want ICU MessageFormat, rich-text in messages, and deep React integration (RSC, SSR).
- **Lingui**: You want a lightweight, extract-and-compile workflow with no runtime overhead from ICU parsing.

---

## How To Use

### 1. Choose a strategy (config.json)

Set the strategy in `config.json`. This determines which libraries to install and which patterns to follow.

### 2. Analyze codebase for hardcoded strings

Run `scripts/extract-strings.ts` to scan `.tsx`/`.ts` files for strings not wrapped in `t()` or `<Trans>`.

### 3. Create translation catalogs

Use the `assets/en.json` template as a starting point. Each locale gets its own catalog file.

### 4. Set up locale routing

Follow `references/locale-routing.md` for sub-path or domain routing strategies.

### 5. Handle pluralization

Refer to `references/pluralization-rules.md` for ICU MessageFormat plural, select, selectordinal syntax.

### 6. Support RTL

Refer to `references/rtl-layout-guide.md` for CSS logical properties and layout changes.

---

## Reference Files

| File | Contents |
|------|----------|
| `config.json` | Strategy config: framework, default locale, supported locales, RTL locales, namespaces |
| `scripts/extract-strings.ts` | TypeScript script that detects hardcoded strings not wrapped in `t()` or `<Trans>` |
| `assets/en.json` | Base English translation template with `common` (20 keys), `errors` (15 keys), `forms` (15 keys) namespaces |
| `references/pluralization-rules.md` | ICU Message `plural`, `select`, `selectordinal` with CLDR category table, English/Spanish/Arabic/Russian examples |
| `references/rtl-layout-guide.md` | CSS logical properties, `dir="rtl"`, flexbox/grid mirroring, icon flipping, testing RTL |
| `references/locale-routing.md` | Sub-path vs domain routing, middleware, locale detection via cookie vs Accept-Language |

---

## Gotchas

1. **Plural keys are language-specific**: English needs `_one` / `_other`. Arabic needs `_zero` / `_one` / `_two` / `_few` / `_many` / `_other`. Do not hardcode plural suffixes — use CLDR plural rules (see `references/pluralization-rules.md`).

2. **Variable name `count` is required by i18next**: The default plural variable in i18next must be named `count`. If not provided, there is no fallback — the key returns undefined.

3. **`one` ≠ `=1`**: In ICU MessageFormat, the `one` plural category means "singular" (matches 1, -1, 1.0, etc.). Use `=1` only when you literally mean the number 1. In some locales, `one` matches numbers ending in 1 (like 11, 21, 31 in Russian).

4. **`other` is required**: In both ICU `{plural}` and `{select}` formats, the `other` case is mandatory per ICU4J spec. Omitting it throws an error in FormatJS and Lingui.

5. **Extract, then translate, never inline**: Workflow should be: extract strings → ship to translators → compile catalogs. Never write translated strings directly in code.

6. **RTL is not just text-align**: Setting `dir="rtl"` on `<html>` is step one. You must audit all margin/padding/padding-inline/border logical properties — especially in flexbox and grid layouts. See `references/rtl-layout-guide.md`.

7. **String extraction misses**: Regex-based scanning (like `scripts/extract-strings.ts`) cannot catch computed template literals or dynamic `t()` calls with variable keys. Use the framework's official extractor (Lingui CLI, i18next-parser, babel-plugin-formatjs) for production.

8. **SSR hydration mismatches**: When using locale-based content on the server vs client, ensure the locale is consistent. Use cookies to persist the user's locale choice between server and client renders.

9. **Namespace conflicts**: Keys across namespaces must not overlap unless intentional. Most libraries fall back to the `common` namespace if no namespace is specified.

10. **ICU escaping**: The ASCII apostrophe `'` escapes syntax in ICU messages. Two consecutive apostrophes produce one literal apostrophe. Prefer curly apostrophe `'` (U+2019) in human-readable strings.

---

## Sources

- [i18next — learn once, translate everywhere](https://github.com/i18next/i18next)
- [FormatJS — react-intl and ICU MessageFormat](https://github.com/formatjs/formatjs)
- [LinguiJS — readable, automated, optimized i18n](https://github.com/lingui/js-lingui)
- [ICU MessageFormat spec](https://unicode-org.github.io/icu/userguide/format_parse/messages)
- [CLDR Language Plural Rules](https://www.unicode.org/cldr/charts/46/supplemental/language_plural_rules.html)
- [Next.js Internationalization guide](https://nextjs.org/docs/app/guides/internationalization)
