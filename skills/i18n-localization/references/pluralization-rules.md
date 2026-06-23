# Pluralization Rules — ICU MessageFormat & CLDR

> Sources:
> - [FormatJS ICU Syntax docs](https://formatjs.github.io/docs/core-concepts/icu-syntax/)
> - [i18next Plurals](https://www.i18next.com/translation-function/plurals)
> - [Lingui Pluralization guide](https://lingui.dev/guides/plurals)
> - [CLDR Language Plural Rules](https://www.unicode.org/cldr/charts/46/supplemental/language_plural_rules.html)
> - [ICU MessageFormat spec](https://unicode-org.github.io/icu/userguide/format_parse/messages)

---

## ICU MessageFormat Plural Types

ICU defines three plural-like format types used inside `{...}`:

| Type | Purpose | Example |
|------|---------|---------|
| `plural` | Cardinal numbers (count, quantity) | `{count, plural, one {# item} other {# items}}` |
| `selectordinal` | Ordinal numbers (1st, 2nd, 3rd) | `{pos, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}` |
| `select` | Gender / enum-based selection | `{gender, select, male {he} female {she} other {they}}` |

### Basic Syntax

```
{<variableName>, <type>, <category> {<output>} <category> {<output>} ...}
```

- `<variableName>` — key looked up in input data
- `<type>` — `plural`, `selectordinal`, or `select`
- `<category>` — CLDR plural category or literal match value
- `<output>` — nested message (can contain further ICU arguments)
- `#` — special token that inserts the numeric value formatted as `{key, number}`

---

## CLDR Plural Categories

The Unicode CLDR defines 6 plural categories. **Only `other` is required.** The rest depend on the language.

| Category | Meaning | Languages using it |
|----------|---------|-------------------|
| `zero` | Zero quantity | Arabic, Latvian, Anii |
| `one` | Singular | English, Spanish, Russian (many) |
| `two` | Dual | Arabic, Welsh, Breton |
| `few` | Paucal (small number) | Arabic (3–10), Russian (2–4), Czech (2–4) |
| `many` | Larger number | Arabic (11–99), Russian (5+), Polish |
| `other` | General plural (fallback) | **All languages — required** |

### CLDR Plural Category Table by Language

| Language | Code | zero | one | two | few | many | other |
|----------|------|------|-----|-----|-----|------|-------|
| English | en | — | ✓ | — | — | — | ✓ |
| Spanish | es | — | ✓ | — | — | — | ✓ |
| French | fr | — | ✓ | — | — | — | ✓ |
| German | de | — | ✓ | — | — | — | ✓ |
| Arabic | ar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Russian | ru | — | ✓ | — | ✓ | ✓ | ✓ |
| Czech | cs | — | ✓ | — | ✓ | ✓ | ✓ |
| Polish | pl | — | ✓ | — | ✓ | ✓ | ✓ |
| Chinese | zh | — | — | — | — | — | ✓ |
| Japanese | ja | — | — | — | — | — | ✓ |
| Korean | ko | — | — | — | — | — | ✓ |
| Turkish | tr | — | ✓ | — | — | — | ✓ |
| Hungarian | hu | — | ✓ | — | — | — | ✓ |
| Hindi | hi | — | ✓ | — | — | — | ✓ |
| Indonesian | id | — | — | — | — | — | ✓ |
| Vietnamese | vi | — | — | — | — | — | ✓ |
| Thai | th | — | — | — | — | — | ✓ |

### Plural Rule Formulas

Each language has a machine-readable rule. Examples:

| Language | `one` rule | `few` rule | `many` rule |
|----------|-----------|-----------|-------------|
| English | `n = 1` | — | — |
| Spanish | `n = 1` | — | — |
| Arabic | `n = 1` | `n % 100 = 3..10` | `n % 100 = 11..99` |
| Russian | `n % 10 = 1 and n % 100 != 11` | `n % 10 = 2..4 and n % 100 != 12..14` | `n % 10 = 0 or n % 10 = 5..9 or n % 100 = 11..14` |

---

## Examples by Language

### English (2 forms: `one`, `other`)

```
// ICU MessageFormat
{count, plural,
  one {# item}
  other {# items}
}

// i18next JSON v4 format
{
  "cart_item_one": "{{count}} item",
  "cart_item_other": "{{count}} items"
}

// Lingui macro
plural(count, {
  one: "# item",
  other: "# items",
})
```

| count | Output |
|-------|--------|
| 0 | `0 items` |
| 1 | `1 item` |
| 5 | `5 items` |
| 101 | `101 items` |

### Spanish (2 forms: `one`, `other`)

```
// ICU MessageFormat
{count, plural,
  one {# artículo}
  other {# artículos}
}

// i18next JSON
{
  "cart_item_one": "{{count}} artículo",
  "cart_item_other": "{{count}} artículos"
}
```

| count | Output |
|-------|--------|
| 0 | `0 artículos` |
| 1 | `1 artículo` |
| 5 | `5 artículos` |

### Arabic (6 forms: `zero`, `one`, `two`, `few`, `many`, `other`)

```
// ICU MessageFormat
{count, plural,
  zero {# كتاب}
  one  {كتاب واحد}
  two  {كتابان}
  few  {# كتب}
  many {# كتابًا}
  other {# كتاب}
}

// i18next JSON v4 — suffixes: _zero, _one, _two, _few, _many, _other
{
  "book_zero": "0 كتاب",
  "book_one": "كتاب واحد",
  "book_two": "كتابان",
  "book_few": "{{count}} كتب",
  "book_many": "{{count}} كتابًا",
  "book_other": "{{count}} كتاب"
}
```

| count | Category | Output |
|-------|----------|--------|
| 0 | zero | `0 كتاب` |
| 1 | one | `كتاب واحد` |
| 2 | two | `كتابان` |
| 3 | few | `3 كتب` |
| 5 | few | `5 كتب` |
| 11 | many | `11 كتابًا` |
| 99 | many | `99 كتابًا` |
| 100 | other | `100 كتاب` |

### Russian (4 forms: `one`, `few`, `many`, `other`)

```
// ICU MessageFormat
{count, plural,
  one  {# книга}
  few  {# книги}
  many {# книг}
  other {# книги}
}

// i18next JSON v4
{
  "book_one": "{{count}} книга",
  "book_few": "{{count}} книги",
  "book_many": "{{count}} книг",
  "book_other": "{{count}} книги"
}
```

| count | Category | Output |
|-------|----------|--------|
| 1 | one | `1 книга` |
| 2 | few | `2 книги` |
| 3 | few | `3 книги` |
| 5 | many | `5 книг` |
| 11 | many | `11 книг` |
| 21 | one | `21 книга` |
| 22 | few | `22 книги` |
| 0 | many | `0 книг` |
| 1.5 | other | `1,5 книги` |

---

## `selectordinal` Format

Used for ordinals (1st, 2nd, 3rd). Same plural categories but based on ordinal rules.

### English Ordinals

```
{position, selectordinal,
  one  {#st}
  two  {#nd}
  few  {#rd}
  other {#th}
}

// i18next JSON — uses _ordinal_ suffix
{
  "place_ordinal_one":  "{{count}}st place",
  "place_ordinal_two":  "{{count}}nd place",
  "place_ordinal_few":  "{{count}}rd place",
  "place_ordinal_other": "{{count}}th place"
}
```

| count | Output |
|-------|--------|
| 1 | `1st` |
| 2 | `2nd` |
| 3 | `3rd` |
| 4 | `4th` |
| 11 | `11th` |
| 12 | `12th` |
| 13 | `13th` |
| 21 | `21st` |

### Arabic Ordinals

All Arabic ordinals use the `other` category — no special ordinal forms.

### Spanish Ordinals

```
{posicion, selectordinal,
  other {#.ª}
}
```

All numbers use `other` — `1.ª`, `2.ª`, `3.ª`, etc.

---

## `select` Format

Used for gender, boolean, or any enum-like selection.

```
{gender, select,
  male   {He will respond shortly.}
  female {She will respond shortly.}
  other  {They will respond shortly.}
}
```

```
{isTaxed, select,
  yes   {An additional {tax, number, percent} tax will be collected.}
  other {No taxes apply.}
}
```

**Rules:**
- `other` is **required** (ICU4J spec).
- Match values are literal — not variable lookups.
- Output can contain nested ICU arguments.

---

## i18next Plural Suffixes (JSON v4)

i18next v4 uses these suffixes appended with `_` separator:

| Suffix | Example key |
|--------|-------------|
| `_zero` | `key_zero` |
| `_one` | `key_one` |
| `_two` | `key_two` |
| `_few` | `key_few` |
| `_many` | `key_many` |
| `_other` | `key_other` |

For ordinal: the same suffixes with `_ordinal_` infix (e.g., `key_ordinal_one`).

**Note:** i18next requires the variable name to be `count`. If `count` is not provided, the key returns `undefined`.

**Interval plurals** (requires `i18next-intervalplural-postprocessor`):

```
"key_interval": "(1)[one item];(2-7)[a few items];(7-inf)[a lot of items];"
```

---

## LinguiJS Plural Macro

Lingui uses a compile-time macro that produces ICU MessageFormat:

```javascript
import { plural } from "@lingui/core/macro";

plural(count, {
  one: "# book",
  other: "# books",
});

// Compiles to: i18n._({ id: "hash", values: { count } })
// Extracted message: {count, plural, one {# book} other {# books}}
```

After a Czech translator translates:

```
{count, plural, one {# kniha} few {# knihy} many {# knihy} other {# knih}}
```

The source code never changes — only the message catalog.

---

## `=value` Exact Match

ICU also supports exact numeric matches with `=value` syntax:

```
{count, plural,
  =0   {No items}
  =1   {One item}
  one  {# item}
  other {# items}
}
```

**Important:** `=1` is NOT the same as `one`. The `one` category can match numbers other than 1 in some languages (e.g., 21, 31 in Russian). Use `=1` only when you strictly mean the literal value 1.

---

## Key Rules

1. **`other` is always required** — ICU throws if missing.
2. **`#` shortcut** — In `plural`/`selectordinal` output, `#` inserts the formatted number.
3. **Nested arguments** — Plural output can contain further `{variable, type, format}`.
4. **Polyfill `Intl.PluralRules`** — Required in older environments. Use `@formatjs/intl-pluralrules`.
5. **Translation freedom** — Translators can use any plural categories their language needs. Code only uses source language forms.
