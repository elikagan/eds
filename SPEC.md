# EDS — Technical Specification

## Overview
EDS is a project-agnostic WYSIWYG design studio for building mobile-first web applications with Claude Code. It enforces design system compliance through structure: every visual element must be a component, every change must go through a ticket, and every result is immediately visible.

EDS is not tied to any specific project. It loads a project's design system CSS and app HTML, and provides the three-column editing environment. The first project to use it is Early Bird, but the tool is designed to work with any single-page web app.

---

## Multi-Project Support

### Project Configuration
Each project is defined by a config file that tells EDS where to find its files:

```json
{
  "name": "Early Bird",
  "version": "0.5.1",
  "appUrl": "http://localhost:8094",
  "designSystemCss": "/path/to/design-system.css",
  "appHtml": "/path/to/index.html",
  "screens": [
    {
      "id": "feed",
      "name": "Feed",
      "section": "Buyer",
      "setup": { "eval": "switchTab('feed')" }
    }
  ],
  "theme": {
    "primary": "#0066FF",
    "typeface": "JetBrains Mono",
    "shapeScale": "md3-default"
  }
}
```

### Project Switcher
EDS has a project dropdown in the top bar. Switching projects reloads the design system panel, the screen list, and the iframe source. Tickets are scoped to a project.

---

## Column 1: UI Display

### Dimensions
- Minimum width: 380px (width of iPhone frame content)
- Column is resizable via drag handle on right edge
- Phone silhouette toggleable via eye icon in column header

### iPhone Frame
- iPhone 15 silhouette: 390x844px, 50px border-radius, Dynamic Island notch
- Content area: 362x770px after accounting for frame padding and notch
- Scaled to fit column via CSS transform (typically 0.7-0.85x)
- Home indicator bar at bottom

### iframe
- Loads from project's `appUrl` (localhost during development)
- Same-origin for localStorage access
- Each screen navigated via eval defined in project config

### Grid Overlay
- Toggleable via grid icon in column header
- 4-column layout: 16px margins, 16px gutters
- 8dp baseline grid shown as subtle horizontal lines
- Grid defined in design system — if the DS changes grid values, overlay updates
- Semi-transparent blue (#0066FF at 8% opacity)

### Component Tooltips
- On hover over any element in the iframe, show the component class name
- Implementation: scan iframe DOM for elements with classes matching known components
- Tooltip appears above the element, shows class name + component category
- Example: hovering a blue button shows "btn-primary (Button > Filled)"

### Phone Toggle
- Eye icon toggles the iPhone silhouette on/off
- When off: iframe renders at full column width with no phone chrome
- Useful for reviewing long scrollable pages without the frame constraint

---

## Column 2: Design System

### Dimensions
- Fills remaining space between Column 1 and Column 3
- Minimum width: 300px
- Scrollable vertically
- Tabbed navigation at top

### Tabs
1. **Foundations** — colors, typography, grid, spacing, elevation, shape, motion
2. **Atoms** — buttons, inputs, icons, badges, dividers, toggles
3. **Molecules** — cards, list items, headers, navigation bars, status pills, chips
4. **Organisms** — complete screen sections (booth setup card, item detail header, etc.)

### Foundation: Colors
Based on M3 color system. Shows:
- 5 key source colors with swatches
- All 29+ derived color roles with name, hex, and usage description
- Semantic colors: success, error, warning, info
- Background and surface tones
- All displayed on 8dp grid

### Foundation: Typography
Based on M3 type scale, customized per project. Shows:
- 15 type styles: display (L/M/S), headline (L/M/S), title (L/M/S), body (L/M/S), label (L/M/S)
- Each shows: font family, weight, size, line-height, letter-spacing
- Live preview of each style with sample text
- For Early Bird: JetBrains Mono everywhere, custom size scale

### Foundation: Grid & Spacing
- 4-column mobile grid: 16dp margins, 16dp gutters
- 8dp baseline spacing system
- Spacing tokens: 4, 8, 12, 16, 20, 24, 32, 48, 64
- Visual ruler showing each spacing value

### Foundation: Elevation
- M3's 5 elevation levels with shadow values
- Preview cards at each elevation

### Foundation: Shape
- M3's 7 shape levels: None (0), XS (4dp), S (8dp), M (12dp), L (16dp), XL (28dp), Full (pill)
- Preview of each with a sample container

### Component Display
Each component shows:
- Visual preview in all states (enabled, disabled, hovered, focused, pressed)
- CSS class name prominently displayed
- The M3 tokens it uses (clickable to jump to foundation)
- Size variants if applicable
- Code snippet showing HTML structure
- 8dp grid alignment visible

### Design System Persistence
The design system is stored as a CSS file (`design-system.css`). This file is:
- The single source of truth for all visual styling
- Loaded by the app via `<link>` tag
- Editable only through tickets (no direct manipulation)
- Version-controlled in the project repo

---

## Column 3: Tickets / Chat

### Dimensions
- Default width: ~420px
- Minimum width: 300px
- Resizable via drag handle on left edge

### Ticket Input
- Text input at bottom of column (like a chat input)
- Send button or Enter to submit
- Creates a new ticket card above

### Ticket Card Structure
```
┌─────────────────────────────┐
│ #14 · [DS] · 2 min ago      │
│                              │
│ "Make the header font 18px   │
│  and add 8px bottom padding" │
│                              │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ Changed .app-header-title    │
│ font-size from 16px to 18px. │
│ Added padding-bottom: 8px    │
│ to .app-header-row.          │
│                     ✓ Done   │
└─────────────────────────────┘
```

Fields:
- **Number:** Sequential (#1, #2, ...)
- **Scope tag:** [DS] for design system, [Screen: Feed] for screen-specific
- **Timestamp:** Relative time
- **User instruction:** The original text
- **Claude response:** What was changed, which files, which components
- **Status:** ⏳ Pending → 🔄 Working → ✓ Done

### Ticket Lifecycle
1. User types instruction, presses Send
2. Ticket created with status ⏳ Pending
3. Claude reads ticket, status → 🔄 Working
4. Claude makes change, writes response, status → ✓ Done
5. Completed ticket fades slightly and compresses
6. Archived tickets settle to bottom of the stack

### Ticket Persistence
- Stored via API (Cloudflare Worker + Supabase)
- Scoped to project + screen
- Retrievable across sessions
- Exportable as markdown

### Ticket Views
- **Per-screen:** Shows only tickets for the current screen
- **Design System:** Shows all [DS] tickets across all screens
- **All:** Shows every ticket for the project, chronological
- Toggle between views via tabs at top of column

---

## Bottom Navigation

### Screen Nav (Left Side)
Organized by section, matching the project config:
```
PRE-AUTH  ● ● ● ●  |  BUYER  ● ● ● ● ● ●  |  DEALER  ● ● ● ● ●  |  ACCOUNT  ●
```
Each dot is clickable, shows screen name on hover. Active screen highlighted.

### Design System Nav (Right Side)
```
FOUNDATIONS  Colors · Type · Grid · Elevation  |  ATOMS  ● ● ●  |  MOLECULES  ● ● ●
```
Clicking a DS section scrolls Column 2 to that section OR opens it as the primary view.

---

## Enforcement Rules

These are displayed permanently in the EDS UI (literally rendered as text in a rules bar):

1. **No inline styling.** All styling must be defined in design-system.css via component classes.
2. **Components only.** Every element in the UI display must use a class from the design system. No ad-hoc HTML.
3. **Grid alignment.** All components must align to the 8dp baseline grid.
4. **Tickets required.** Every change must originate from a ticket. No silent modifications.
5. **Verify before done.** A ticket cannot be marked done until the change is visually confirmed in the UI display.

---

## Local Development Server

### Architecture
```
localhost:8094  →  Ruby httpd serving the app (index.html + design-system.css)
localhost:8097  →  Node.js write server (accepts POST, writes files to disk)
localhost:8094/studio/  →  EDS UI (loaded from same server as app)
```

### Write Server (studio/server.js)
~30 lines of Node.js:
```javascript
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.end(); return; }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { file, content } = JSON.parse(body);
      // Only allow writing to specific files
      const allowed = ['design-system.css', 'index.html'];
      if (!allowed.includes(file)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.writeFileSync(`/path/to/project/${file}`, content);
      res.writeHead(200);
      res.end('OK');
    });
  }
}).listen(8097);
```

### Ticket API
Reuses the existing Cloudflare Worker pattern:
- `POST /api/eds/tickets` — create ticket
- `PATCH /api/eds/tickets/:id` — update status/response
- `GET /api/eds/tickets?project=early-bird&screen=feed` — get tickets
- `GET /api/eds/tickets?project=early-bird&scope=ds` — design system tickets

---

## File Structure
```
eds/
  README.md          — what EDS is and why
  SPEC.md            — this file
  CLAUDE.md          — rules for building EDS
  studio/
    index.html       — the three-column UI
    server.js        — local write server
  projects/
    early-bird.json  — project config for Early Bird
```

---

## Implementation Priority
1. **Column 1 (UI Display)** — iPhone frame + iframe + grid overlay + phone toggle
2. **Column 3 (Tickets)** — Input, card creation, persistence via API
3. **Column 2 (Design System)** — Start with foundations (colors, type, spacing), add components incrementally
4. **Bottom Nav** — Screen navigation + DS section navigation
5. **Write Server** — Local file writing for instant changes
6. **Component Tooltips** — DOM scanning for component labels
7. **Multi-project support** — Project config and switcher
