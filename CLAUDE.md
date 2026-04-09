# EDS — Claude Code Rules

## What This Is
EDS (Eli Design Studio) is a WYSIWYG design tool for building mobile-first web apps. It is a DEVELOPMENT TOOL used by a designer working with Claude Code. It is NOT an end-user app.

## Read Before Doing Anything
1. `SPEC.md` — full technical specification. Every architectural decision is documented there. See "Implementation Status" section for what's built vs planned.
2. `README.md` — context and motivation. Understand WHY this tool exists.
3. `projects/*.json` — project configurations. Understand the data model.

---

## How to Run EDS

```bash
# Start the EDS server (serves both the app and EDS studio on one port)
node studio/server.js early-bird 8097

# Open EDS in browser
open http://localhost:8097/eds/

# The app is also available at the root
open http://localhost:8097/
```

**Using Claude Code preview:** The launch config is in the parent `.claude/launch.json` under the name `eds`. The runtime executable must be the full path `/opt/homebrew/bin/node` because Homebrew isn't in Claude Code's default PATH.

---

## Architecture (As Built)

### Single Node Server (`studio/server.js`)
One process handles everything — no Ruby WEBrick, no separate processes:
- `GET /` — serves app files from the project's `appRoot` directory
- `GET /eds/` — serves EDS studio from `studio/` directory
- `GET /eds/config.json` — serves the project config (re-reads each request for freshness)
- `GET /eds/tickets/*.json` — serves ticket data files
- `POST /write` — writes files to project or EDS directories

Same-origin serving means the iframe and EDS share localStorage, which is how screen auth switching works.

### Ticket Storage
Tickets are local JSON files in `eds/tickets/`, one per project:
- `tickets/early-bird.json` — all tickets for Early Bird
- Read by EDS UI on load via `GET /eds/tickets/early-bird.json`
- Written by EDS UI via `POST /write` with `projectRoot` set to the EDS directory
- Persisted to GitHub via git commit+push after every completed ticket

### No External Dependencies
- No Supabase table for tickets (was in original spec, removed)
- No Cloudflare Worker for ticket API (EDS gets its own worker later if needed)
- No npm packages. No build step. Pure Node `http` module + `fs`.

---

## Critical Build Rules

1. **EDS uses its own CSS, prefixed `eds-`.** Never use a project's design system classes for EDS's own UI. EDS has its own dark-theme styles in `studio/eds.css`.
2. **Three columns are non-negotiable.** Do not simplify to two columns. Do not merge columns. The three-column layout is the core product.
3. **The ticket system is the primary interface.** Without tickets, the tool has no purpose.
4. **Speed is a hard requirement.** The iframe must reload within 200ms of a file write. If it's slow, the tool is useless.
5. **Multi-project support is designed in from day one.** The project config JSON structure, file paths, and ticket scoping all support multiple projects even though only Early Bird exists.
6. **No inline styling in EDS itself.** EDS enforces this rule on projects — it must follow the rule itself. All EDS styling goes in `studio/eds.css`.
7. **Comment-based metadata in CSS.** The design system panel parses `@eds-foundation`, `@eds-component`, `@eds-class`, `@eds-token`, `@eds-variants`, and `@eds-states` comments from the project's `design-system.css`. The project's CSS is also loaded into the EDS page via a `<link>` tag so component previews render live with actual project styles.

## CSS Class Naming
- EDS internal classes: `eds-` prefix (e.g., `eds-topbar`, `eds-col-1`, `eds-ticket-card`)
- Project design system classes: defined by the project, no prefix required
- Never mix: EDS elements use `eds-` classes only. Project elements use project classes only.

## File Write Safety
The write server (`studio/server.js`) must:
- Only allow writing `.css`, `.html`, and `.json` files
- Validate that the resolved path is within the project root OR the EDS root (no path traversal)
- Log every write to console with timestamp and file path
- The write server is a dumb pipe — it writes bytes to files. No git, no validation of content, no side effects.

---

## Claude Code ↔ EDS Contract

This is the most important section. EDS and Claude Code have distinct, non-overlapping responsibilities. Two shared files form the contract between them.

### `design-system.css` — The Styling Contract
**Owner:** EDS (creates and maintains)
**Consumer:** Claude Code (reads to know what components exist)

- Lives in the project's `appRoot` directory (e.g., `dealer-exchange/design-system.css`)
- Contains ALL styling as component classes with `@eds-` metadata comments
- Claude Code reads this file before building any screen to know available components
- `@eds-` comments are machine-readable: `@eds-component`, `@eds-class`, `@eds-variants`, `@eds-token`, etc.
- **If Claude Code needs a component that doesn't exist in this file**, it creates an EDS ticket describing what it needs — it NEVER writes inline styles or ad-hoc classes

### `eds/projects/{name}.json` — The Screen Contract
**Owner:** Claude Code (updates when creating/restructuring screens)
**Consumer:** EDS (reads to populate screen navigation)

- Lives in the EDS repo under `projects/`
- Each screen entry: `{ id, name, section, desc, setup: { clearAuth?, user?, eval? } }`
- The `desc` field serves as the screen's outline — a plain-language description of what's on it
- When Claude Code creates a new screen, it adds the entry here
- When Claude Code restructures a screen, it updates the `setup.eval` and `desc`

### Structure vs Style
| | Claude Code | EDS |
|---|---|---|
| **Builds** | New screens, features, HTML layout, API endpoints | Tokens, components, visual refinement |
| **Writes** | App HTML, `eds/projects/*.json`, API code | `design-system.css`, app HTML (styling only) |
| **Never does** | Create CSS classes or inline styles | Create new screens or app structure |

### Example Workflow
1. Claude Code builds a new "Watching" tab screen → writes HTML → updates `projects/early-bird.json` with the screen entry
2. User opens EDS → sees new screen in the nav dots → navigates to it
3. User writes ticket: "Style the Watching tab — item rows should match the Feed card pattern"
4. Claude (in EDS mode) reads `design-system.css`, applies existing component classes, writes changes
5. iframe reloads → user sees styled screen → ticket marked done → git commit+push

---

## Git Workflow
- **Commit and push after EVERY completed ticket.** Non-negotiable. This is the persistence/reliability mechanism.
- Commit message format: `EDS #N: [description of what changed]`
- The write server does NOT handle git — Claude Code does it as part of the ticket processing workflow
- If a session crashes, `git pull` recovers to the last completed ticket
- Git history mirrors ticket history exactly — every ticket is a commit

---

## Testing Checklist
After building any feature, verify by:
1. Start the server: `node studio/server.js early-bird 8097`
2. Open EDS: `http://localhost:8097/eds/`
3. Confirm iframe loads the app
4. Navigate to at least 3 screens (pre-auth, buyer, dealer) — verify auth switching
5. Write a test ticket — confirm the card appears with correct scope and timestamp
6. Switch ticket view tabs — confirm filtering works
7. Reload the page — confirm state persistence (screen, tabs)

---

## File Structure
```
eds/
  README.md                — what EDS is and why it exists
  SPEC.md                  — full technical spec + implementation status
  CLAUDE.md                — this file (rules for building EDS)
  studio/
    index.html             — the three-column studio UI (~300 lines)
    server.js              — Node server: app + studio + write endpoint (~100 lines)
    eds.css                — EDS's own dark-theme styling (~250 lines)
  projects/
    early-bird.json        — project config (22 screens, 5 users, theme)
  tickets/
    early-bird.json        — ticket data (persisted via git)
```
