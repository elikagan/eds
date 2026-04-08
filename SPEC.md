# EDS — Technical Specification

## Overview
EDS is a project-agnostic WYSIWYG design studio for building mobile-first web applications with Claude Code. It enforces design system compliance through structure: every visual element must be a component, every change must go through a ticket, and every result is immediately visible.

EDS is not tied to any specific project. It loads a project's design system CSS and app HTML, and provides the three-column editing environment. The first project to use it is Early Bird, but the tool is designed to work with any single-page web app.

---

## Multi-Project Support

### Project Configuration
Each project is defined by a JSON config file in `eds/projects/`:

```json
{
  "name": "Early Bird",
  "version": "0.5.1",
  "appRoot": "/Users/elikagan/Desktop/Claude stuff/dealer-exchange",
  "appUrl": "http://localhost:8094",
  "designSystemCss": "design-system.css",
  "appHtml": "index.html",
  "screens": [
    {
      "id": "feed",
      "name": "Feed",
      "section": "Buyer",
      "desc": "Browse items with TikTok-style scroll",
      "setup": { "user": "eli", "eval": "switchTab('feed')" }
    }
  ],
  "users": {
    "eli": "8935f2ac-4998-4e6d-9c31-47dbbce896fd",
    "loubna": "9cc49ca0-1235-43aa-bbcb-93a0742b9aea"
  },
  "theme": {
    "primary": "#0066FF",
    "onPrimary": "#FFFFFF",
    "surface": "#FAFAF8",
    "onSurface": "#1A1A1A",
    "outline": "#555555",
    "outlineVariant": "#888888",
    "typeface": "JetBrains Mono",
    "shapeScale": "md3-default"
  }
}
```

### Project Switcher
EDS has a project dropdown in the top bar. Switching projects:
- Reloads the iframe with the new project's `appUrl`
- Repopulates the design system panel from the new project's `design-system.css`
- Updates the screen navigation from the new project's `screens` array
- Switches the ticket view to the new project's tickets

### Bootstrapping a New Project
When a project doesn't yet have a `design-system.css` file, EDS generates one from the project config's `theme` values. This starter CSS contains:
- All M3 color tokens mapped from the 5 key colors
- The typography scale using the specified typeface
- M3 shape scale and spacing tokens
- Skeleton component classes (buttons, inputs, cards, etc.) with M3 specs
- The grid system (4-column mobile, 16dp margins, 16dp gutters)

The designer then customizes this CSS through tickets.

---

## Column 1: UI Display

### Dimensions
- Minimum width: 380px (width of iPhone 15 content area)
- Column is resizable via drag handle on right edge
- Minimum enforced — cannot shrink below phone width

### iPhone Frame
- iPhone 15 silhouette: 390x844px, 50px border-radius
- Dynamic Island: 126x36px centered pill at top
- Home indicator: 140x5px centered bar at bottom
- Frame color: #000 with subtle #333 outer border
- Content area: ~362x770px after frame padding and notch clearance
- Scaled via CSS transform to fit column height (typically 0.7-0.85x depending on viewport)

### Phone Toggle
- Eye icon button in column header (top-right)
- Toggles the iPhone silhouette on/off
- When OFF: iframe renders at full column width, no frame, no notch, no home indicator
- When OFF: content scrolls naturally — useful for long pages
- Toggle state persists in localStorage

### iframe
- Loads from project's `appUrl` (localhost during development, same origin)
- Same-origin access for localStorage manipulation (setting auth tokens for different users per screen)
- Each screen navigated by: setting localStorage for the right user → reloading → running the screen's `eval` string from the project config
- iframe ID: `eds-app-frame`

### Screen Setup Semantics
Each screen in the project config has a `setup` object that controls how the iframe is configured:
- `clearAuth: true` — remove all auth tokens from localStorage before loading. Used for pre-auth screens (landing, onboarding, verify). Mutually exclusive with `user`.
- `user: "eli"` — set localStorage auth tokens to this user's ID (looked up from the project config's `users` object). The app reads these on load to authenticate.
- `eval: "..."` — JavaScript executed in the iframe after the page loads. Used to navigate to specific screens, open sheets, scroll to elements, etc.
- If neither `clearAuth` nor `user` is set, the iframe loads with whatever auth state exists in localStorage (inherit from previous screen).

The user's `role` in the config is informational — EDS doesn't filter screens by role. All screens are always visible in the nav. The role field helps the designer understand which user to assign to which screen.

### Grid Overlay
- Toggleable via grid icon button in column header (next to phone toggle)
- Renders as an absolutely-positioned transparent div overlaying the iframe
- 4-column layout: 16dp margins on left/right, 16dp gutters between columns
- Columns shown as semi-transparent blue (#0066FF at 6% opacity)
- 8dp horizontal baseline lines shown as 1px #0066FF at 4% opacity
- Grid values come from the design system — if the DS changes grid tokens, the overlay updates
- Toggle state persists in localStorage

### Component Tooltips
- When mouse hovers over an element in the iframe, show a tooltip with the component's class name
- Implementation: inject a mouseover listener into the iframe that scans for elements with classes matching known components from the design system
- Known components are read from the design-system.css file (any class that's defined there)
- Tooltip format: `btn-primary` (class) + `Button > Filled` (category from DS panel)
- Tooltip appears above the element, follows cursor horizontally
- Tooltip styled: dark bg (#333), white text, 11px mono, 4px padding, 4px radius

---

## Column 2: Design System

### Dimensions
- Fills remaining horizontal space between Column 1 and Column 3
- Minimum width: 300px
- Scrollable vertically
- Has its own 8dp grid overlay (always visible, subtle)

### Tab Navigation
Fixed tab bar at top of column:
1. **Foundations** — colors, typography, grid/spacing, elevation, shape, motion
2. **Atoms** — buttons, inputs, icons, badges, dividers, toggles, switches
3. **Molecules** — cards, list items/rows, headers/app bars, navigation, status pills, chips, bottom sheets
4. **Organisms** — complete screen sections (e.g., booth setup card, item detail compact header, inquiry thread)

### How a Foundation is Displayed

Example: Colors section
```
┌─────────────────────────────────┐
│ COLORS                          │
│                                 │
│ Primary                         │
│ ┌──────┐ #0066FF                │
│ │      │ --md-sys-color-primary │
│ └──────┘ Buttons, links, active │
│                                 │
│ On Primary                      │
│ ┌──────┐ #FFFFFF                │
│ │      │ --md-sys-color-on-primary│
│ └──────┘ Text on primary bg     │
│                                 │
│ Surface                         │
│ ┌──────┐ #FAFAF8                │
│ │      │ --md-sys-color-surface │
│ └──────┘ Page backgrounds       │
│ ...                             │
└─────────────────────────────────┘
```

Each color shows: swatch, hex value, CSS custom property name, usage description.

Example: Typography section
```
┌─────────────────────────────────┐
│ TYPOGRAPHY                      │
│                                 │
│ Headline Large                  │
│ This is headline large     24px │
│ JetBrains Mono · 700 · 1.2 lh  │
│ --md-sys-typescale-headline-lg  │
│                                 │
│ Body Medium                     │
│ This is body medium text   13px │
│ JetBrains Mono · 400 · 1.5 lh  │
│ --md-sys-typescale-body-md      │
│ ...                             │
└─────────────────────────────────┘
```

Each type style shows: sample text rendered in that style, size, font/weight/line-height, CSS custom property.

### How a Component is Displayed

Example: Button > Filled (Primary)
```
┌─────────────────────────────────┐
│ BUTTON > FILLED                 │
│ .btn-primary                    │
│                                 │
│ States:                         │
│ ┌──────────┐ ┌──────────┐      │
│ │ Enabled  │ │ Disabled │      │
│ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐      │
│ │ Hovered  │ │ Focused  │      │
│ └──────────┘ └──────────┘      │
│ ┌──────────┐                    │
│ │ Pressed  │                    │
│ └──────────┘                    │
│                                 │
│ Variants:                       │
│ .btn-primary.btn-compact        │
│ .btn-primary.loading            │
│                                 │
│ Tokens:                         │
│ bg: --md-sys-color-primary      │
│ text: --md-sys-color-on-primary │
│ height: 48px min                │
│ padding: 14px 24px              │
│ radius: --md-sys-shape-sm (8dp) │
│                                 │
│ HTML:                           │
│ <button class="btn-primary">    │
│   Label                         │
│ </button>                       │
└─────────────────────────────────┘
```

Each component shows:
1. Category + name
2. CSS class name (prominently)
3. Visual preview of every state (rendered live, not images)
4. Variants with their modifier classes
5. Token references (clickable — jumps to that foundation)
6. Size specs (height, padding, radius — in dp values)
7. HTML code snippet

### Design System Source of Truth
The design system panel is populated by PARSING the `design-system.css` file. It's not hardcoded in the studio. This means:
- When a ticket changes a token value, the panel updates on next reload
- When a new component class is added, it appears in the panel
- The CSS file has structured comments that the parser reads:

```css
/* @eds-foundation: Colors */
/* @eds-token: primary | Primary brand color | Buttons, links, active states */
--md-sys-color-primary: #0066FF;

/* @eds-component: Button > Filled */
/* @eds-class: btn-primary */
/* @eds-variants: btn-compact, loading */
.btn-primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  /* ... */
}
```

**CSS Comment Metadata Format (strict):**
```
/* @eds-foundation: [Section Name] */
/* @eds-token: [name] | [description] | [usage] */
/* @eds-component: [Category] > [Name] */
/* @eds-class: [css-class-name] */
/* @eds-variants: [variant1], [variant2], ... */
/* @eds-states: [enabled], [disabled], [hovered], [focused], [pressed] */
```

Rules:
- Each `@eds-` comment is a single line (no multiline)
- Pipe (`|`) separates fields within a comment
- `@eds-component` must appear before the class definition it describes
- `@eds-class` must match exactly one CSS selector in the file
- If parsing fails on a comment, skip it silently and continue
- Ticket numbers can't change component names — if a name changes, it's a new component (old one stays in archive)

This comment-based metadata system keeps the CSS as the source of truth while giving EDS enough information to build the panel.

---

## Column 3: Tickets / Chat

### Dimensions
- Default width: ~420px
- Minimum width: 300px
- Resizable via drag handle on left edge

### Ticket Input
- Fixed at bottom of column (like iMessage)
- Multiline textarea, auto-expanding (1-4 lines)
- Send button (or Cmd+Enter)
- Creates a new ticket card above

### Ticket Card
```
┌─────────────────────────────────┐
│ #14 · [DS] · 2 min ago     ⏳   │
│                                 │
│ "Make the header font 18px      │
│  and add 8px bottom padding"    │
│                                 │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ Changed .app-header-title       │
│ font-size: 16px → 18px.        │
│ Added padding-bottom: 8px       │
│ to .app-header-row.             │
│ Files: design-system.css        │
│                        ✓ Done   │
└─────────────────────────────────┘
```

Fields:
- **Number:** Sequential per project (#1, #2, ...)
- **Scope tag:** `[DS]` for design system changes, `[Screen: Feed]` for screen-specific, `[Global]` for app-wide
- **Timestamp:** Relative time ("2 min ago", "1h ago", "yesterday")
- **User instruction:** The original text, always visible
- **Claude response:** What was changed — which classes, which properties, which files. Specific and verifiable.
- **Status icon:** ⏳ Pending → 🔄 Working → ✓ Done

### Ticket Lifecycle
1. User types instruction, presses Send
2. Ticket created with ⏳ Pending status, stored via API
3. Claude Code session detects new ticket (via polling or notification)
4. Status → 🔄 Working
5. Claude makes the change to design-system.css and/or app HTML
6. Claude writes the local files via the write server
7. iframe reloads, change visible in Column 1
8. Claude writes response text describing what changed
9. Status → ✓ Done
10. Ticket card visually compresses (instruction still readable, response collapsed)
11. After several completed tickets, old ones archive to a scrollable "completed" section at bottom

### Ticket Persistence & API
Stored via Cloudflare Worker + Supabase (same infrastructure as Early Bird):
- `POST /api/eds/tickets` — create ticket `{ project, screen, instruction, scope }`
- `PATCH /api/eds/tickets/:id` — update `{ status, response }`
- `GET /api/eds/tickets?project=early-bird&screen=feed` — per-screen tickets
- `GET /api/eds/tickets?project=early-bird&scope=ds` — all design system tickets
- `GET /api/eds/tickets?project=early-bird` — all tickets for project

Tickets persist across sessions. A new Claude Code session can read all pending tickets and resume where the last left off.

### Ticket Views (tabs at top of Column 3)
- **This Screen:** Tickets for the currently selected screen
- **Design System:** All [DS] tickets across all screens
- **All:** Every ticket for the project, chronological
- **Archive:** Completed tickets only

### How Tickets Reach Claude
Two modes:

**Live mode (Claude Code session running):**
- A cron job in the session polls `GET /api/eds/tickets?status=pending` every 10 seconds
- When a new ticket is found, Claude processes it immediately
- Status updates and responses are written back via the API
- Changes are written to files via the local write server

**Async mode (no session running):**
- Tickets queue with ⏳ Pending status
- User starts a Claude Code session and says "process EDS tickets"
- Claude reads all pending tickets and processes them in order
- Useful for batching work or when the user wants to write multiple tickets then process

---

## Bottom Navigation

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│ PRE-AUTH ● ● ● ● | BUYER ● ● ● ● ● ● | DEALER ● ● ● ● | ACCT ● │ DS  Fnd · Atm · Mol · Org │
└──────────────────────────────────────────────────────────────────────┘
```

### Screen Nav (Left Side)
- Dots organized by section, matching the project config's `screens` array
- Section labels in small caps between dot groups
- Active screen dot is filled/highlighted
- Dots with tickets show a count badge
- Hover shows screen name
- Click navigates: updates Column 1 iframe, Column 3 tickets

### Design System Nav (Right Side)
- Section labels: Foundations · Atoms · Molecules · Organisms
- Click scrolls Column 2 to that section
- OR: click replaces Column 2 with a focused view of just that section

---

## Enforcement Rules

Displayed permanently in the EDS UI as a thin rules bar between the top bar and the columns:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠ No inline styling │ Components only │ 8dp grid │ Tickets required │
└──────────────────────────────────────────────────────────────────────┘
```

1. **No inline styling.** All styling must be defined in `design-system.css` via component classes. `style=""` attributes are prohibited on app HTML elements.
2. **Components only.** Every visible element in the UI display must use a class from the design system. No unstyled HTML, no ad-hoc classes.
3. **8dp grid alignment.** All spacing and sizing values must be multiples of 8dp (with 4dp for fine adjustments). The grid overlay in Column 1 makes violations visible.
4. **Tickets required.** Every change must originate from a ticket in Column 3. No silent modifications to CSS or HTML.
5. **Verify before done.** A ticket cannot be marked ✓ Done until the change is visually confirmed in Column 1's iframe.

---

## State Persistence

When EDS is closed and reopened:
- **Active screen:** Restored from localStorage (`eds-active-screen`)
- **Column widths:** Restored from localStorage (`eds-col-widths`)
- **Phone toggle state:** Restored from localStorage (`eds-phone-visible`)
- **Grid toggle state:** Restored from localStorage (`eds-grid-visible`)
- **Active DS tab:** Restored from localStorage (`eds-ds-tab`)
- **Ticket view tab:** Restored from localStorage (`eds-ticket-view`)
- **Active project:** Restored from localStorage (`eds-active-project`)
- **Pending tickets:** Persisted in API (Supabase), always available

---

## Local Development Server

### Architecture
```
localhost:[project-port]    →  Ruby/Python httpd serving the app files
localhost:8097              →  Node.js write server (shared across projects)
localhost:[project-port]/   →  App loads index.html + design-system.css from here
```

EDS studio itself is opened directly as a file (`open eds/studio/index.html`) or served from its own port. Since the iframe points to the project's localhost, it's same-origin with the app but not necessarily with the studio. For localStorage access to work, the studio should be served from the same port as the app (e.g., `localhost:8094/eds/` for Early Bird).

### Write Server (`studio/server.js`)
Shared across all projects. The project root path comes from the POST request body.

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const ALLOWED_EXTENSIONS = ['.css', '.html', '.json'];

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/write') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { projectRoot, file, content } = JSON.parse(body);
        const ext = path.extname(file);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          res.writeHead(403); res.end('File type not allowed'); return;
        }
        // Prevent path traversal
        const resolved = path.resolve(projectRoot, file);
        if (!resolved.startsWith(path.resolve(projectRoot))) {
          res.writeHead(403); res.end('Path traversal denied'); return;
        }
        fs.writeFileSync(resolved, content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, file: resolved }));
      } catch (e) {
        res.writeHead(500); res.end(e.message);
      }
    });
  } else {
    res.writeHead(404); res.end('Not found');
  }
}).listen(8097, () => console.log('EDS write server on :8097'));
```

### Ticket API
Reuses the Cloudflare Worker infrastructure. New Supabase table:

```sql
CREATE TABLE eds_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT NOT NULL,
  screen TEXT,
  scope TEXT DEFAULT 'screen',
  instruction TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_eds_tickets_project ON eds_tickets(project, created_at DESC);
CREATE INDEX idx_eds_tickets_status ON eds_tickets(status);
```

---

## EDS Internal Styling

EDS itself uses its own CSS classes, prefixed with `eds-` to avoid collision with any project's design system:
- `.eds-topbar`, `.eds-col`, `.eds-col-resize`, `.eds-phone`, `.eds-grid-overlay`
- `.eds-ds-panel`, `.eds-ds-tab`, `.eds-ds-token`, `.eds-ds-component`
- `.eds-ticket`, `.eds-ticket-input`, `.eds-ticket-card`, `.eds-ticket-done`
- `.eds-nav`, `.eds-nav-dot`, `.eds-nav-section`
- `.eds-rules-bar`

EDS does NOT use the project's design system for its own UI. It has its own minimal dark-theme styling (dark bg, light text, monospace, minimal).

---

## File Structure
```
eds/
  README.md                — what EDS is and why it exists
  SPEC.md                  — this file
  CLAUDE.md                — rules for building EDS itself
  studio/
    index.html             — the three-column studio UI
    server.js              — local write server (Node.js)
    eds.css                — EDS's own styling (dark theme)
  projects/
    early-bird.json        — project config for Early Bird
```

---

## Project Onboarding

EDS defines a strict contract for what a project repo must have to work with it. Any project — Early Bird or future ones — goes through the same onboarding process.

### The Contract: What a Project Needs

| Requirement | What | Why |
|---|---|---|
| **Project config** | `eds/projects/{name}.json` in the EDS repo | Tells EDS where files are, what screens exist, what theme to use |
| **Design system CSS** | `design-system.css` in the project root (same directory as the app HTML, resolved from `appRoot` in the project config) | The single source of truth for all styling. EDS reads and writes this file. |
| **Link tag in HTML** | `<link rel="stylesheet" href="design-system.css">` in the app's HTML `<head>`, BEFORE any inline `<style>` blocks | So the DS file loads and inline styles can be gradually migrated out |
| **Local server** | App served on localhost at a known port | EDS loads the app in an iframe from this URL |
| **CSS metadata comments** | `@eds-` structured comments in `design-system.css` | EDS parses these to populate the design system panel (Column 2) |

### Validation: EDS Checks on Load

When EDS opens a project, it runs a validation check and reports status in the top bar:

1. **Config exists?** — Does `projects/{name}.json` exist and parse as valid JSON?
2. **App reachable?** — Can the iframe load `appUrl`? (Is the local server running?)
3. **CSS file exists?** — Does `design-system.css` exist at the project root?
4. **Link tag present?** — Does the app HTML contain `<link ... href="design-system.css">`?
5. **Metadata parseable?** — Does the CSS file contain at least one `@eds-` comment?

Each check shows ✓ or ✗ in a status row. If anything fails, EDS shows what's wrong and what to do.

### Scaffolding: EDS Creates What's Missing

If the project is new to EDS (no `design-system.css` exists), EDS can scaffold it:

1. **Generate `design-system.css`** from the project config's `theme` values:
   - All M3 color tokens derived from the key colors (primary, secondary, surface, error, success)
   - Typography scale using the specified typeface (15 M3 type styles)
   - Shape scale tokens (7 levels from the config)
   - Spacing tokens (4, 8, 12, 16, 20, 24, 32, 48, 64)
   - Grid system (4-column mobile, 16dp margins, 16dp gutters)
   - Skeleton component classes (buttons, inputs, cards, etc.) with `@eds-` metadata comments
   - Written to the project root via the write server

2. **Inject `<link>` tag** into the app HTML if missing:
   - Reads the HTML file via the write server
   - Inserts `<link rel="stylesheet" href="design-system.css">` before the first `<style>` tag
   - Writes back via the write server

3. **Report results** in the ticket system:
   - Auto-creates ticket #1: "EDS onboarding: scaffolded design-system.css with M3 tokens from theme config"
   - Lists every token and component class that was generated
   - Status: ✓ Done

After scaffolding, the project is ready for design work via tickets.

### Onboarding Early Bird (First Project)

Early Bird is the first project to use EDS. Its config is at `eds/projects/early-bird.json`. The onboarding sequence:

1. EDS reads config → gets app root, URL, theme (JetBrains Mono, #0066FF primary, warm palette), 22 screens, 5 test users
2. Scaffolding generates `design-system.css` with Early Bird's theme applied to M3 tokens
3. Link tag injected into `index.html`
4. iframe loads the app — now rendering with both the new DS CSS and the existing inline styles
5. Migration begins via tickets: each ticket moves one component from inline `<style>` to `design-system.css`, deleting the inline rule. One component at a time, verified visually.

End state: `index.html` has zero inline styling. Everything in `design-system.css`. Every element uses a component class.

---

## Implementation Priority

Multi-project support is DESIGNED IN from the start (all data structures, API calls, and file paths use project config), but the project switcher UI is built last since there's only one project initially. The data model supports it from day one; the dropdown comes later.

1. **Project config + write server** — `projects/early-bird.json` + `server.js`. Define the data model and test file writing standalone.
2. **Column 1 (UI Display)** — iPhone frame + iframe loading from project's `appUrl` + phone toggle. No grid or tooltips yet.
3. **Column 3 (Tickets)** — Input, card creation, API persistence. The core interaction loop.
4. **Ticket processing loop** — Claude reads pending tickets via `GET /api/eds/tickets?status=pending`. In live mode: a `CronCreate` job in Claude Code polls every 10-15 seconds. In async mode: user says "process tickets" and Claude reads + processes all pending.
5. **Column 2 (Design System)** — Start with foundations only (colors + typography). Parse from CSS `@eds-` comments.
6. **Bottom Nav** — Screen navigation dots from project config. DS section nav.
7. **Grid overlay** — 4-column + 8dp baseline on Column 1.
8. **Component tooltips** — Hover labels from iframe DOM scan.
9. **Design system bootstrapper** — Generate starter `design-system.css` from project theme config.
10. **Project switcher UI** — Dropdown in top bar. Last because only one project exists initially.
