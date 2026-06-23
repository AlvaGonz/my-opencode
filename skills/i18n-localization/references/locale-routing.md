# Locale Routing Strategies

> Sources:
> - [Next.js Internationalization](https://nextjs.org/docs/app/guides/internationalization)
> - [Lingui Documentation](https://lingui.dev)
> - [i18next (learn once, translate everywhere)](https://github.com/i18next/i18next)
> - [FormatJS monorepo](https://github.com/formatjs/formatjs)

---

## Two Routing Strategies

| Strategy | URL Example | Best For |
|----------|-------------|----------|
| **Sub-path routing** | `example.com/en/page`, `example.com/ar/page` | Most apps, SEO with `hreflang`, simple setup |
| **Domain routing** | `en.example.com`, `example.es` | Country-specific TLDs, enterprise, brand per market |

---

## Sub-Path Routing

### Next.js App Router

Folder structure:

```
app/
├── [lang]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   └── products/
│       └── page.tsx
└── layout.tsx  (root — redirects to /en)
```

### Locale Detection Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["en", "es", "fr", "ar"];
const defaultLocale = "en";

function getPreferredLocale(request: Request): string {
  const headers = { "accept-language": request.headers.get("accept-language") || "" };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    // Persist detected locale to cookie
    const locale = pathname.split("/")[1];
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
    return response;
  }

  // Redirect to locale-prefixed path
  const locale = getPreferredLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|.*\\.).*)"],
};
```

### Static Generation

```typescript
// app/[lang]/layout.tsx
export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }, { lang: "fr" }, { lang: "ar" }];
}
```

---

## Domain Routing

### Configuration

```typescript
// next.config.js (Pages Router — App Router uses middleware)
module.exports = {
  i18n: {
    locales: ["en", "es", "fr", "ar"],
    defaultLocale: "en",
    domains: [
      {
        domain: "example.com",
        defaultLocale: "en",
      },
      {
        domain: "example.es",
        defaultLocale: "es",
      },
      {
        domain: "example.fr",
        defaultLocale: "fr",
      },
      {
        domain: "example.com.eg",
        defaultLocale: "ar",
      },
    ],
  },
};
```

### App Router Domain Detection via Middleware

```typescript
// middleware.ts — domain-based locale detection
const domainLocaleMap: Record<string, string> = {
  "example.com": "en",
  "example.es": "es",
  "example.fr": "fr",
  "example.com.eg": "ar",
};

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const domainLocale = domainLocaleMap[host];

  if (domainLocale) {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", domainLocale);
    return response;
  }

  // Fallback to Accept-Language detection
  const locale = getPreferredLocale(request);
  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", locale);
  return response;
}
```

---

## Locale Detection Methods

| Method | Mechanism | Pros | Cons |
|--------|-----------|------|------|
| **Accept-Language header** | Browser sends preferred languages | No user action needed | May not match user intent on shared devices |
| **Cookie** | `NEXT_LOCALE` or custom cookie | Persistent across sessions | Needs initial detection |
| **LocalStorage** | Client-side JS read | Works in SPA | SSR mismatch risk |
| **URL path** | `/en/page` explicit | Clear, shareable, SEO-friendly | Longer URLs |
| **Subdomain** | `en.example.com` | Clear brand per market | DNS + cert per domain |
| **Navigator.language** | Browser API | Simple | Only works client-side |
| **Geolocation** | IP-based | No user input needed | Inaccurate, privacy concerns |

### Recommended Detection Order

```
1. URL path / subdomain (explicit user choice)
2. Cookie (persisted preference)
3. Accept-Language header (browser default)
4. Default locale
```

### i18next Language Detection

```javascript
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18next.use(LanguageDetector).init({
  detection: {
    // Order of detection
    order: ["cookie", "navigator", "htmlTag", "path", "subdomain"],

    // Cache user choice in cookie
    caches: ["cookie"],

    // Cookie config
    lookupCookie: "i18next",
    cookieMinutes: 525600, // 1 year

    // Path-based detection: /en/page
    lookupFromPathIndex: 0,

    // Subdomain: en.example.com
    lookupFromSubdomainIndex: 0,

    // HTML tag
    htmlTag: document.documentElement,
  },
});
```

### Lingui Locale Detection

```javascript
// Custom detection using @lingui/detect-locale
import { detect, fromCookie, fromStorage, fromPath, fromNavigator } from "@lingui/detect-locale";

const locale = detect(
  fromCookie("lang"),          // check cookie first
  fromPath(0),                 // then URL path segment 0
  fromStorage("lang"),         // then localStorage
  fromNavigator(),             // then browser language
  "en"                         // fallback
);
```

---

## Locale Persistence

### Cookie-Based (Recommended)

```typescript
// Set cookie on locale switch
function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

// Read cookie in middleware
function getLocaleFromCookie(request: NextRequest): string | undefined {
  return request.cookies.get("NEXT_LOCALE")?.value;
}
```

### Server-Side (Next.js RSC)

```typescript
// app/[lang]/layout.tsx
import { cookies } from "next/headers";

async function getServerLocale(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("NEXT_LOCALE")?.value || "en";
}
```

---

## SEO Considerations

### `hreflang` tags

```tsx
// app/[lang]/layout.tsx
export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const locales = ["en", "es", "fr", "ar"];

  return (
    <html lang={lang}>
      <head>
        {locales.map((locale) => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={`https://example.com/${locale}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://example.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Canonical URLs

Always include the locale in the canonical URL:

```html
<link rel="canonical" href="https://example.com/es/productos" />
```

### Sitemap per locale

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";

const locales = ["en", "es", "fr", "ar"];
const baseUrl = "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/products", "/contact"];

  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}${route}`]),
        ),
      },
    })),
  );
}
```

---

## Locale Switcher Component

```tsx
// components/LocaleSwitcher.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const locales = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export function LocaleSwitcher({ currentLang }: { currentLang: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: string) {
    startTransition(() => {
      // Replace the locale segment in the path
      const segments = pathname.split("/");
      segments[1] = nextLocale;
      const newPath = segments.join("/") || "/";

      // Set cookie
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

      router.push(newPath);
    });
  }

  return (
    <select
      value={currentLang}
      onChange={(e) => switchLocale(e.target.value)}
      disabled={isPending}
    >
      {locales.map((locale) => (
        <option key={locale.code} value={locale.code}>
          {locale.label}
        </option>
      ))}
    </select>
  );
}
```

---

## Framework-Specific Routing

| Framework | Strategy | Package |
|-----------|----------|---------|
| **Next.js App Router** | `[lang]/` dynamic segment + middleware | `@formatjs/intl-localematcher`, `negotiator` |
| **Next.js Pages Router** | Built-in `i18n` config | `next.config.js` `i18n` block |
| **Remix** | `resourceRoutes` + loader locale detection | `@remix-run/i18n` |
| **Gatsby** | `@gatsbyjs/gatsby-plugin-i18n` | `gatsby-plugin-react-i18next` |
| **Vite / SPA** | `react-router-dom` basename | `i18next-browser-languagedetector` |
| **Astro** | `astro-i18next` integration | `astro-i18next` |
| **Express (SSR)** | `app.get("/:lang/...")` middleware | `i18next-http-middleware` |

---

## Key Rules

1. **Always redirect root** — `/` should 302 to `/{detected-locale}/`.
2. **Set cookie after detection** — Persists user choice across visits.
3. **Validate locale in middleware** — Return 404 for unsupported locales.
4. **Use `<html lang>` + `<html dir>`** — Both must match the active locale.
5. **SEO: `hreflang` + canonical** — Every page needs both.
6. **Don't rely on `Accept-Language` alone** — Let users override.
