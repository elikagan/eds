# EDS — Claude Code Rules

## What This Is
EDS (Eli Design Studio) is a WYSIWYG design tool. It is NOT a web app for end users — it is a development tool used by a designer working with Claude Code.

## Critical Rules
1. EDS itself must be built with the same discipline it enforces. No inline styling. Use CSS classes.
2. The three-column layout is non-negotiable. Do not simplify it to two columns.
3. The ticket system is the primary interface. It must work before anything else.
4. Speed matters more than features. The iframe must reload within 200ms of a file write.
5. Multi-project support must be designed in from the start, not bolted on later.

## Stack
- Single HTML file: `studio/index.html`
- Local write server: `studio/server.js` (Node.js, ~30 lines)
- Ticket persistence: Cloudflare Worker API
- No build step. No framework. No dependencies.

## Read Before Building
- `SPEC.md` — full technical specification
- `README.md` — context and motivation
- `projects/early-bird.json` — first project config (create this)
