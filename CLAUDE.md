# EDS — Claude Code Rules

## What This Is
EDS (Eli Design Studio) is a WYSIWYG design tool for building mobile-first web apps. It is a DEVELOPMENT TOOL used by a designer working with Claude Code. It is NOT an end-user app.

## Read Before Doing Anything
1. `SPEC.md` — full technical specification. Every architectural decision is documented there.
2. `README.md` — context and motivation. Understand WHY this tool exists.
3. `projects/*.json` — project configurations. Understand the data model.

## Critical Build Rules
1. **EDS uses its own CSS, prefixed `eds-`.** Never use a project's design system classes for EDS's own UI. EDS has its own dark-theme styles in `studio/eds.css`.
2. **Three columns are non-negotiable.** Do not simplify to two columns. Do not merge columns. The three-column layout is the core product.
3. **The ticket system is the primary interface.** Build it before the design system panel. Without tickets, the tool has no purpose.
4. **Speed is a hard requirement.** The iframe must reload within 200ms of a file write. If it's slow, the tool is useless.
5. **Multi-project support is designed in from day one.** The project config JSON structure, the API scoping by project, the file paths — all must support multiple projects even if only one exists initially.
6. **No inline styling in EDS itself.** EDS enforces this rule on projects — it must follow the rule itself. All EDS styling goes in `studio/eds.css`.
7. **Comment-based metadata in CSS.** The design system panel parses `@eds-foundation`, `@eds-component`, `@eds-class`, `@eds-token`, and `@eds-variants` comments from the project's `design-system.css`. This is how the panel knows what to display.

## CSS Class Naming
- EDS internal classes: `eds-` prefix (e.g., `eds-topbar`, `eds-col-1`, `eds-ticket-card`)
- Project design system classes: defined by the project, no prefix required
- Never mix: EDS elements use `eds-` classes only. Project elements use project classes only.

## File Write Safety
The write server (`studio/server.js`) must:
- Only allow writing `.css`, `.html`, and `.json` files
- Validate that the resolved path is within the project root (no path traversal)
- Log every write to console with timestamp and file path
- Never write to EDS's own files — only to the project directory

## Testing
After building any feature, verify by:
1. Starting the write server: `node studio/server.js`
2. Starting the project's local server (e.g., Ruby httpd for Early Bird)
3. Opening EDS in the browser
4. Confirming the iframe loads the project
5. Writing a test ticket and confirming the change appears

## Stack
- `studio/index.html` — the three-column UI (single HTML file)
- `studio/eds.css` — EDS's own dark-theme styling
- `studio/server.js` — local write server (Node.js, <50 lines)
- Ticket persistence: Cloudflare Worker API + Supabase `eds_tickets` table
- No build step. No framework. No npm dependencies. Pure HTML/CSS/JS + Node http module.
