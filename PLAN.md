# EDS — Path Forward for Early Bird

Three steps between where we are now and using EDS for design work. Each step has a different owner (EDS config, Claude Code, or EDS tickets) and must be done in order.

---

## Step 1: Restore All Screens to EDS Config

**Owner:** EDS config (`eds/projects/early-bird.json`)
**What:** The QA tool had 35 screens. The EDS config currently has 22. The config needs to match the QA tool's 35 screens exactly. This means adding 16 missing screens, removing 1 premature screen (`item-detail-conversation`), and renaming 6 screens whose IDs don't match.

### Missing Screens (16 to add)

| Screen | Section | Why it was missing |
|---|---|---|
| Feed — Saved (Empty) | Buyer | Merged into one "feed-saved" entry |
| Feed — Saved (Has Favorites) | Buyer | Merged into one "feed-saved" entry |
| Feed — Filter Sheet | Buyer | Omitted |
| Conversation (Buyer) | Buyer | Omitted (will be restructured in Step 2, but should exist first) |
| Messages (Buyer) | Buyer | Was renamed to "Watching" prematurely — original should exist for current state |
| Messages (Empty) | Buyer | Omitted |
| Booth — Empty (Post-Setup) | Dealer | Omitted |
| Conversation (as Seller) | Dealer | Omitted |
| Messages (Dealer) | Dealer | Omitted |
| Admin Dashboard | Admin | Entire section omitted |
| Admin — Markets | Admin | Entire section omitted |
| Admin — Dealers | Admin | Entire section omitted |
| Admin — Items | Admin | Entire section omitted |
| Admin — SMS Blast | Admin | Entire section omitted |
| Loading State | States | Entire section omitted |
| Error State | States | Entire section omitted |

### Screens to Rename/Adjust

The EDS config has screens that don't match the QA tool — some were prematurely restructured based on ROADMAP decisions that haven't been implemented yet, and some have different IDs:

**Premature restructuring (revert to match current app):**

| EDS Config Screen | Issue | Fix |
|---|---|---|
| `item-detail-conversation` | This state doesn't exist yet — conversations aren't on item detail pages yet | Remove for now, re-add when Step 2 implements it |
| `watching` | The Watching tab doesn't exist yet — Messages tab is still the current UI | Rename back to "Messages" to match current state |
| `account-buyer` / `account-dealer` | Were renamed from "Settings" | Rename back to match current app (`settings-buyer` / `settings`) |

**ID mismatches (EDS config uses different IDs than the QA tool):**

| EDS Config ID | QA Tool ID | Fix |
|---|---|---|
| `feed` | `feed-populated` | Rename to `feed-populated` |
| `item-detail-live` | `item-detail` | Rename to `item-detail` |
| `booth-setup` | `booth-fresh` | Rename to `booth-fresh` |
| `my-item` | `item-detail-own` | Rename to `item-detail-own` |
| `feed-dealer` | `feed-as-dealer` | Rename to `feed-as-dealer` |
| `item-detail-dealer` | `item-detail-as-dealer` | Rename to `item-detail-as-dealer` |

### Principle
**The EDS config must reflect the app AS IT EXISTS TODAY, not as it will exist after structural changes.** Step 2 modifies the app and updates the config together. Putting future-state screens in the config before the code exists creates broken iframe loads.

### Result
After Step 1: EDS config has 35 screens with IDs matching the QA tool exactly. Every screen loads correctly in the iframe. The app hasn't changed — only the config file was updated.

**Status: DONE (April 8, 2026).** All 35 screens verified:
- Pre-Auth (5): landing-buyer, landing-dealer, onboarding, verify-success, verify-failure
- Buyer (12): feed-populated, feed-saved-empty, feed-saved-populated, feed-filter-sheet, item-detail, item-detail-held, item-detail-sold, compose, conversation, messages-buyer, messages-empty, settings-buyer
- Dealer (9): booth-fresh, booth-empty, booth-active, booth-picker, add-item, item-detail-own, conversation-seller, messages-populated, settings
- Dealer as Buyer (2): feed-as-dealer, item-detail-as-dealer
- Admin (5): admin-dashboard, admin-markets, admin-dealers, admin-items, admin-sms
- States (2): loading, error

**Note:** The QA-NOTES.md header says nav order is `Buy / Sell / Watching / Account` but the ROADMAP (the authoritative source) says `Buy · Watching | Sell | Account`. The ROADMAP order is correct. The QA-NOTES.md header was written before the nav decision was finalized.

---

## Step 2: Structural Changes (Claude Code on Early Bird)

**Owner:** Claude Code session working on the Early Bird repo (`dealer-exchange/`)
**What:** Execute the approved architecture decisions from `ROADMAP.md`. These are HTML/JS/API changes, not styling.

### Changes in Priority Order

**2a. Nav Rename — DONE (April 8, 2026)**
- Renamed: Shop→Buy, Booth→Sell, Messages→Watching
- Reordered tabs: Buy · Watching | Sell | Account (was Shop | Booth | Messages | Account)
- Watching icon changed from chat bubble to heart
- Screen headers: "My Booth"→"Sell", "Messages"→"Watching"
- "Shop inventory"→"Browse inventory" on landing page
- EDS config sections updated: Buyer→Buy, Dealer→Sell, Dealer as Buyer→Seller as Buyer
- **Visual grouping (`·` vs `|` separator) not yet implemented** — needs CSS work via EDS ticket

**2b. Kill Messages Tab → Watching Tab — DONE (April 8, 2026)**
- Create the Watching tab: shows items you've favorited OR have conversations about
- Each row: thumbnail, current price, dealer name, status pill, heart/chat indicators
- PRICE DROP badge when price lowered, strikethrough on old price
- Sorted by most recent activity
- Tap → opens item detail (with conversation if one exists)
- **API needed:** `GET /api/watching` — deferred, using client-side merge of `GET /api/favorites` + `GET /api/conversations` for now
- **Implemented:** `loadWatching()` merges favorites + buyer-only conversations by item_id, sorted by most recent activity. Heart icon for favorites, chat bubble for conversations. Price drop badge when previous_price > current price. Empty state with heart + "Nothing yet". Worker updated to include title + previous_price + dealer photo_url in favorites response.
- **After:** EDS config updated — `messages-buyer` → `watching`, `messages-empty` → `watching-empty`, `messages-populated` → `watching-dealer`. Conversation screens unchanged.

**2c. Item Detail Page States — IN PROGRESS**
- **Chunk A (API + state detection): DONE** — `GET /api/items/:id` returns `my_conversation` + `is_owner`
- **Chunk B (State 2 — buyer conversation): DONE** — compact header, inline conversation, reply textarea, router update, Watching tab links
- **Chunk C (State 3 — dealer, no inquiries): NOT STARTED**
- **Chunk D (State 4 — dealer, with inquiries): NOT STARTED**

Original spec:
- **State 1 (Browsing):** Current behavior — full detail, compose buttons. No change needed.
- **State 2 (Active conversation):** Item compresses to compact header (thumbnail 48px + price + status + dealer name in one row). Expandable chevron to show full item details if needed. Conversation thread becomes main content. Reply input at bottom (iMessage-style auto-expanding, 1 line → 4 max).
- **State 3 (Dealer, no inquiries):** Full detail + edit button + status controls (Live/Hold/Sold). Market context shown: "Listed in Downtown Modernism · Apr 26".
- **State 4 (Dealer, has inquiries):** Compact header + accordion threads per buyer. Hold/Sold dropdowns list buyers.
- **API needed:** `GET /api/items/:id` needs `my_conversation` field when authenticated
- **After:** Update EDS config — add item-detail-conversation, item-detail-dealer-inquiries screens

**2d. Dealer Inquiry Threading**
- On dealer's item detail (State 4): inquiries organized as accordion by buyer
- Green dot for unread, tap Reply expands full thread inline
- Only one thread expanded at a time
- Hold/Sold dropdowns list buyers who inquired
- **After:** Update EDS config — update dealer item detail screen setup

**2e. Price Drop Notifications**
- When dealer lowers price: "Notify X watchers?" prompt
- SMS to everyone who favorited or inquired
- PRICE DROP badge in Watching tab
- **API needed:** `PATCH /api/items/:id` with `notify_watchers` flag, detect price decrease
- **After:** Update EDS config — add price-drop confirmation screen/sheet

**2f. Logged-In Home Page**
- Returning users should not see the sign-up pitch
- Open design question: redirect to Buy tab, or show a dashboard
- **Decision needed from user before building**
- **After:** Update EDS config — add logged-in home screen

### Contract Reminder
For every structural change, Claude Code must:
1. Build the HTML/JS in `index.html`
2. Update the API in `worker/index.js` if needed
3. Update `eds/projects/early-bird.json` with new/modified screen entries
4. Read `design-system.css` and use only existing component classes
5. If a new component is needed, create an EDS ticket — don't write inline styles

### Result
After Step 2: The app has the new nav, Watching tab, conversation-on-item-detail, inquiry threading, and price drop flow. The EDS config reflects all new screens. The app may look rough because styling hasn't been addressed — that's Step 3's job.

---

## Step 3: Component Mapping and Gap Analysis

**Owner:** EDS (designer + Claude in EDS mode)
**What:** Walk through every screen in EDS, identify every UI element, map it to an existing DS component or flag it as a gap that needs a new component.

### Process

For each screen:
1. Load it in EDS (Column 1 iframe)
2. Use component tooltips to see what classes elements have
3. For each element, categorize:
   - **Mapped:** Uses a DS component class (e.g., `.btn-primary`, `.status-pill`) → no action
   - **Inline:** Has styling but no DS class → needs migration ticket
   - **Missing:** Needs a component that doesn't exist in the DS yet → needs creation ticket
4. Create EDS tickets for each gap found

### Expected Gaps (based on QA notes and ROADMAP)

**New molecules needed:**
- **App Header** — unified header component replacing 6 different implementations
- **Item Card** — feed item card (photo, price, title, dealer avatar, status, fav button)
- **Conversation Item** — row in the Watching/Messages list (avatar, name, last message, time)
- **Message Bubble** — chat message (user vs other, avatar, timestamp)
- **Reply Input** — iMessage-style auto-expanding textarea
- **Sheet** — bottom sheet (overlay, handle, content area)
- **Booth Item Card** — dealer's item in booth list (thumbnail, price, status, actions)
- **Inquiry Row** — buyer inquiry in dealer's accordion (avatar, name, message preview, actions)
- **Market Row** — market in landing page list (name, date, countdown)
- **Toast** — notification toast (avatar, message, auto-dismiss)
- **Empty State** — icon + message + optional action button

**New organisms needed:**
- **Compact Item Header** — compressed item info (thumbnail 48px + price + status + name in one row) used when conversation is active
- **Inquiry Accordion** — collapsible thread per buyer on dealer's item detail
- **Booth Setup Form** — market setup with inline payment config

**New atoms needed:**
- **Photo Grid** — drag-reorder photo slots for Add Item. First photo = main photo indicator. Plus button as last slot. Camera vs album choice on tap. Must be best-in-class buttery smooth drag.
- **Searchable Autocomplete** — for filter dropdowns that won't scale (100+ dealers). Replaces simple `<select>`.
- **Toggle** — "Price Firm" toggle for Add Item, defaults to off
- **Avatar** — square with rounded corners (12px radius), replacing circles. Used in onboarding, dealer info, conversation.

**Token-level changes (not components, but affect every screen):**
- `--muted: #666` → `#555` (currently too light, called out on 6+ screens in QA)
- `--dim: #AAA` → `#888` (illegible on multiple screens)
- These are already corrected in `design-system.css` tokens (`--md-sys-color-on-surface-variant: #555`, `--md-sys-color-outline-variant: #888`) but the inline CSS still uses the old values. Migration tickets will fix this screen by screen.

**Components needing variant additions:**
- **Status Pill:** needs "price-drop" variant
- **Button:** needs states for all QA-noted disabled conditions (post button disabled until photo+price, confirm button disabled until required fields)
- **Nav Tab:** needs Buy/Watching/Sell/Account labels + buyer-only/dealer-only visibility
- **Dealer Avatar:** size increase from 32px to 44px+ on item cards in feed

### Ticket Format
Each gap becomes an EDS ticket with a specific scope:
- `[DS] Create .app-header component: logo left, optional title center, optional right action`
- `[DS] Create .item-card molecule: photo full-width, avatar overlay bottom-left, fav button bottom-right, info row below`
- `[Screen: Feed] Migrate feed header from inline to .app-header`
- `[Screen: Booth] Migrate booth item list to .booth-item-card`

### Result
After Step 3: Every element on every screen is either using a DS component or has a ticket to create/migrate one. The design system is complete (all molecules and organisms exist), and screen-specific tickets apply them.

---

## Summary

| Step | Owner | Input | Output |
|---|---|---|---|
| 1. Restore screens | EDS config | QA tool's 35 screens | Config matches current app state |
| 2. Structural changes | Claude Code (Early Bird) | ROADMAP decisions | New nav, Watching tab, conversation states, inquiry threading |
| 3. Component mapping | EDS (designer + Claude) | Walk every screen | Complete DS with all molecules/organisms, migration tickets |

Steps 1 and 2 happen in Claude Code sessions on the respective repos. Step 3 happens in EDS.
