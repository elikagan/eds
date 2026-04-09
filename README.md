# EDS — Eli Design Studio

A WYSIWYG design system tool built to solve a specific problem: AI coding assistants (Claude Code) cannot be trusted to implement design systems consistently. They lose discipline in long sessions, half-implement plans, claim completion without verification, and ignore established component patterns in favor of inline styling and one-off solutions.

EDS enforces design system compliance through structure, not trust.

## The Problem

Over the course of building a mobile-first marketplace app (Early Bird), the developer experienced 5 failed attempts at implementing a consistent design system using Claude Code:

1. CSS class consolidation that was never uniformly applied
2. A 39-step plan that was claimed complete at 35% actual completion
3. A corrective plan that repeated the same failure pattern
4. A component library that existed in CSS but wasn't used consistently
5. A rushed v0.6 release that was reverted within hours

The root cause is documented across the Claude Code community (GitHub issues #6159, #22140, #17097): the AI stops mid-task, takes shortcuts, and produces plausible-looking but incomplete work. No amount of planning, CLAUDE.md rules, or verbal promises has fixed this.

**EDS exists because the honor system doesn't work.**

## The Solution

EDS is a three-column desktop tool for designing and building mobile-first web applications:

### Column 1: UI Display (380px min)
- iPhone silhouette with browser chrome (toggleable)
- Live preview of the app screen loaded in an iframe
- 4-column grid overlay (toggleable) — 16px margins, 16px gutters, 8dp baseline
- Tooltips on every element showing the component name from the design system
- **Rule: Nothing can appear in this display that isn't a component from Column 2**

### Column 2: Design System
- Scrollable, tabbed view of all design tokens and components
- Organized from foundations (color, typography, grid, elevation, shape) up through atoms (buttons, inputs, icons) to molecules (cards, list items, headers, navigation)
- Based on Material Design 3's structure, customized with project-specific theming
- Every component shown in all states (enabled, disabled, hovered, focused, pressed)
- 8dp grid underlaid, all components aligned to it
- Labeled and tooltipped

### Column 3: Tickets / Chat
- Instruction input where the user writes a change request
- Each instruction becomes a numbered ticket card
- Claude reads the ticket, executes the change, and responds in the card
- Changes must go through the design system — no inline styling
- Completed tickets compress and archive to the bottom
- Tickets are scoped: [DS] for design system changes, [Screen: Feed] for specific screens
- All tickets are stored and retrievable — full audit trail

### Bottom Nav
- Screen navigation: all app screens organized by flow (Pre-Auth, Buyer, Dealer, etc.)
- Design system sections: Colors, Typography, Grid, Elevation, Components
- Each navigable independently

### Rules (Displayed Permanently in the UI)
1. Claude cannot create inline styling
2. All styling changes must go through the master design system CSS
3. Everything in the UI display must be a component from the design system
4. Components must align to the 8dp baseline grid
5. All changes require a ticket — no silent modifications

## Architecture

### Speed
The tool and the app run on localhost. Changes are NOT deployed to GitHub during iteration — that's only for backup/deploy. The workflow:

1. Design system lives in `design-system.css` — a standalone file loaded by the app
2. A local write server (~30 lines) accepts POST requests and writes CSS/HTML changes
3. The iframe reloads from localhost after each write (~200ms)
4. Git push happens when a batch of tickets is complete, not on every change

### Design System Foundation: Material Design 3
M3 was chosen because it's the most comprehensively documented component system available. It defines every component with exact sizing tokens, every possible state, spacing rules, and accessibility requirements. It's designed to be customized — swap the color scheme, type scale, and shape scale, and all components adapt.

For Early Bird specifically: JetBrains Mono as the typeface, warm muted palette, M3 shape and spacing tokens.

### Ticket Flow
1. User writes instruction in the chat column
2. Ticket is created and stored (via API)
3. Claude Code session reads the ticket
4. Claude makes the change to design-system.css or the app HTML
5. Local write server pushes the change to the file system
6. iframe reloads, change is visible
7. Claude marks ticket done with notes on what changed
8. User verifies visually

If a Claude Code session is running, tickets are processed live. If not, they queue for the next session.

## Tech Stack
- Single HTML file for the studio UI (`studio/index.html`)
- Node.js server serves app + studio + write endpoint on one port (`studio/server.js`)
- Ticket persistence: local JSON files committed to git
- Material Design 3 token system for the design system CSS
- No build step, no framework, no npm dependencies. Pure HTML/CSS/JS + Node http module.

## Status (April 8, 2026)
**v1 built.** The three-column studio is functional:
- iPhone 15 frame with Safari chrome, 22-screen navigation with auth switching
- Ticket creation with scope detection, local JSON persistence, 4 view tabs
- Screen dot navigation organized by section + DS section nav
- Rules bar, state persistence (screen, tabs)

**Not yet built:** Design system panel CSS parser, grid overlay, component tooltips, design system bootstrapper, ticket processing loop (Claude executing tickets), project switcher.

See `SPEC.md` "Implementation Status" section for the full breakdown.

## Quick Start
```bash
node studio/server.js early-bird 8097
open http://localhost:8097/eds/
```

## Related
- **Early Bird** — the first project to use EDS. A mobile-first pre-market marketplace for LA flea markets. Source: `/Users/elikagan/Desktop/Claude stuff/dealer-exchange/`. See `ROADMAP.md` for architecture decisions and `QA-NOTES.md` for design feedback.
