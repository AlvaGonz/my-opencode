---
name: playwright
description: "Unified Playwright browser automation skill. Use when the user needs to navigate websites, interact with pages, fill forms, take screenshots, extract data, generate tests, explore web apps, or automate browser workflows. Covers interactive CLI, custom script execution, website exploration, and test generation."
---

# Playwright — Unified Browser Automation

This skill merges four capability areas into one. Use the section that matches your task:

- **CLI Automation** — Quick interactive browser commands via `playwright-cli` (navigation, clicking, forms, screenshots, network interception)
- **Custom Scripts** — Write and execute Playwright scripts for complex workflows, multi-step tests, and programmatic automation
- **Website Exploration** — Explore and document website features, identify UI elements and locators
- **Test Generation** — Generate Playwright test code from observed interaction scenarios

---

## Setup

```bash
# One-time: install Playwright and Chromium
cd <skill-dir> && npm run setup
```

**Path Resolution Note:** This skill may be installed in different locations (plugin system, global, project-specific). Use the path where this SKILL.md file resides as `<skill-dir>`.

---

## Section 1: CLI Automation (playwright-cli)

Use for quick, interactive browser sessions — navigate, click, type, screenshot, and inspect.

### Quick Start

```bash
playwright-cli open https://example.com
playwright-cli snapshot
playwright-cli click e1
playwright-cli fill e2 "user@example.com"
playwright-cli screenshot --filename=page.png
playwright-cli close
```

### Core Commands

| Category | Commands |
|----------|----------|
| Navigation | `open`, `goto`, `go-back`, `go-forward`, `reload` |
| Interaction | `click`, `dblclick`, `fill`, `type`, `press`, `select`, `hover`, `drag`, `upload`, `check`, `uncheck` |
| Input | `eval`, `run-code` |
| Dialogs | `dialog-accept`, `dialog-dismiss` |
| Screenshot/PDF | `screenshot`, `snapshot`, `pdf` |
| Tabs | `tab-list`, `tab-new`, `tab-close`, `tab-select` |
| Storage | `state-save`, `state-load`, `cookie-*`, `localstorage-*`, `sessionstorage-*` |
| Network | `route`, `route-list`, `unroute` |
| DevTools | `console`, `network`, `tracing-start`, `tracing-stop`, `video-start`, `video-stop` |
| Sessions | `-s=<name>`, `list`, `close-all`, `kill-all` |

### Open Parameters

```bash
playwright-cli open --browser=chrome|firefox|webkit|msedge
playwright-cli open --extension          # Connect via extension
playwright-cli open --persistent         # Use persistent profile
playwright-cli open --profile=/path/to   # Custom profile directory
playwright-cli open --config=config.json # Config file
```

### Snapshots

After each command, playwright-cli provides a snapshot of current browser state:

```bash
> playwright-cli goto https://example.com
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

### Storage State

```bash
playwright-cli state-save auth.json   # Save cookies + localStorage
playwright-cli state-load auth.json   # Restore previous state
```

### Request Mocking

```bash
# Block image requests
playwright-cli route "**/*.jpg" --status=404
# Mock API response
playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
```

### Examples

**Form submission:**
```bash
playwright-cli open https://example.com/form
playwright-cli fill e1 "user@example.com"
playwright-cli fill e2 "password123"
playwright-cli click e3
playwright-cli close
```

**Multi-page debug:**
```bash
playwright-cli open https://example.com
playwright-cli tracing-start
playwright-cli click e4
playwright-cli fill e7 "test"
playwright-cli console
playwright-cli tracing-stop
playwright-cli close
```

---

## Section 2: Custom Script Automation

Use for complex, multi-step automation tasks that require programmatic logic. Scripts are written to `/tmp/` and executed via the included `run.js` wrapper.

### Workflow

1. **Auto-detect dev servers** (for localhost testing):
   ```bash
   cd <skill-dir> && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
   ```

2. **Write script to /tmp** — never write to the skill directory:
   ```javascript
   // /tmp/playwright-test-page.js
   const { chromium } = require('playwright');
   const TARGET_URL = 'http://localhost:3001'; // Parameterized

   (async () => {
     const browser = await chromium.launch({ headless: false });
     const page = await browser.newPage();
     await page.goto(TARGET_URL);
     console.log('Title:', await page.title());
     await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
     await browser.close();
   })();
   ```

3. **Execute from skill directory**:
   ```bash
   cd <skill-dir> && node run.js /tmp/playwright-test-page.js
   ```

### Common Patterns

**Responsive testing:**
```javascript
const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];
for (const vp of viewports) {
  await page.setViewportSize(vp);
  await page.goto(TARGET_URL);
  await page.screenshot({ path: `/tmp/${vp.name.toLowerCase()}.png` });
}
```

**Login flow:**
```javascript
await page.goto(`${TARGET_URL}/login`);
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');
```

**Broken link checker:**
```javascript
const links = await page.locator('a[href^="http"]').all();
for (const link of links) {
  const href = await link.getAttribute('href');
  const response = await page.request.head(href);
  if (!response.ok()) console.log(`Broken: ${href} (${response.status()})`);
}
```

### Available Helpers (`lib/helpers.js`)

```javascript
const helpers = require('./lib/helpers');
await helpers.detectDevServers();      // Find running dev servers
await helpers.safeClick(page, sel);    // Click with retry
await helpers.safeType(page, sel, val);// Type with clear
await helpers.takeScreenshot(page, name);
await helpers.handleCookieBanner(page);
await helpers.extractTableData(page, sel);
```

### Custom HTTP Headers

```bash
# Single header
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  node run.js /tmp/script.js

# Multiple headers (JSON)
PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Debug":"true"}' \
  node run.js /tmp/script.js
```

### Best Practices

- **Visible browser by default**: use `headless: false` unless user requests headless
- **Parameterize URLs**: always put detected/provided URL in `TARGET_URL` constant
- **Write to /tmp**: never write test files to skill directory or user's project
- **Use `slowMo: 100`** for visible debugging
- **Use wait strategies** (`waitForURL`, `waitForSelector`, `waitForLoadState`) over fixed timeouts
- **Always use try-catch** for robust error handling

---

## Section 3: Website Exploration

Use to discover and document website features before writing tests or automation scripts.

### Workflow

1. Navigate to the provided URL
2. Identify 3-5 core features or user flows
3. Document interactions, relevant UI elements (and their locators), and expected outcomes
4. Capture snapshots/screenshots for reference

### Output

For each feature explored, document:
- **Flow**: Steps performed
- **Selector**: CSS/XPath locators used
- **Expected behavior**: What the application should do
- **Actual behavior**: What was observed
- **Screenshot**: Visual reference

### Example

```markdown
## Feature: User Login
1. Navigate to /login
2. Fill email input (`input[name="email"]`)
3. Fill password input (`input[name="password"]`)
4. Click submit (`button[type="submit"]`)
5. Expected: Redirect to /dashboard
6. Actual: ✅ Redirect successful
```

---

## Section 4: Test Generation

Use to generate Playwright test code from real browser interaction sessions. Run steps interactively first, then emit the test.

### Workflow

1. **Do NOT** generate test code from the scenario alone
2. Execute each step using Playwright CLI or scripts above
3. Observe the actual browser behavior, locators, and responses
4. Only after all steps are complete, emit a Playwright TypeScript test using `@playwright/test`

### Test Output Requirements

- Use `@playwright/test` framework
- Include proper `test()` and `expect()` blocks
- Use locators observed during exploration (not guessed selectors)
- Include `page.setViewportSize()` for responsive coverage
- Add comments for any flaky or timing-dependent steps

### Example Output

```typescript
import { test, expect } from '@playwright/test';

test('user can log in and see dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator('.welcome')).toContainText('Welcome back');
});
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Playwright not installed | `cd <skill-dir> && npm run setup` |
| Module not found | Run from skill directory via `run.js` wrapper |
| Browser doesn't open | Check `headless: false` and display availability |
| Element not found | Add `await page.waitForSelector('.el', { timeout: 10000 })` |
| Multiple dev servers detected | Ask user which port to use |

## API Reference

For comprehensive Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):
- Selectors & Locators
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques
- CI/CD integration

## Sources
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [playwright-cli](https://github.com/microsoft/playwright-cli) — CLI commands reference
- [@playwright/test](https://playwright.dev/docs/api/class-test) — Test framework API
