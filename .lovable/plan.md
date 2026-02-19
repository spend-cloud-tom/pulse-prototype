

# CareFlow — Final Prototype Plan
*"One system. Four perspectives. Zero bureaucracy."*

---

## Global Shell (Always Visible)

### Automation Banner (Top Bar, Role-Aware Tone)
A calm, full-width bar with role-adaptive copy:
- **Anouk**: "We've handled everything for you today. Just **1 thing** needs your attention."
- **Rohan**: "AI processed **42 transactions** today. **6** require financial review."
- **Sarah**: "**4 signals** awaiting your action. AI matched suppliers for 2."
- **Jolanda**: "**3 team requests** need your approval."

Subtle background, small text, but always present — frames the entire product as automation-first.

### Role Toggle Switcher (Top-Right)
Pill-shaped, elegant switcher with 4 users, each with:
- Realistic avatar photo
- Name + role label
- **Focus statement** beneath: "Focus: Get things done" / "Focus: Control risk" / "Focus: Supply continuity" / "Focus: Approvals"
- On switch: **structural morph animation** — cards reshape and reflow, not just fade. A brief tooltip appears: "You are now viewing as Rohan — Finance Admin"

---

## Signal as a Visual System

Every card across all roles is visually identifiable as a **Signal**:
- Subtle "Signal" badge or label on each card (e.g., `Signal #2847`)
- A small pulse dot icon on active/pending Signals
- **AI Confidence rendered as a visual spectrum**, not just a number:
  - **Green bar** = High confidence (auto-processed)
  - **Amber bar** = Medium confidence (needs review)
  - **Red bar** = Low confidence (human required)
- This spectrum appears as a thin colored bar along the left edge of each Signal card

---

## Anouk's View — Care Worker (Default)

**The emotional hero of the demo. Radical simplicity.**

- **Warm greeting**: "Good morning, Anouk" — large, calm typography
- **Pending Signals as gentle cards**: "Can you confirm Thomas's bike arrived?" with a single-tap resolve button. Each card is minimal — just the ask and the action.
- **One floating "Start" button** — large, centered, inviting
- **On tap → Conversational flow**: AI asks "What happened?" in a chat-like interface. Dynamic chips appear based on context — "I bought something", "Something arrived", "I need something". Anouk never navigates a menu; she describes her situation and AI guides the rest.
- **Photo upload prompt** appears contextually. Auto-categorization happens silently. Confirmation in 3 taps.
- **No ledger codes. No cost centers. No policy jargon. Ever.**
- **Minimal history link**: "View past items" — statuses read "All sorted ✓" or "Waiting for Rohan"

---

## Rohan's View — Finance Admin

**Decision clarity, not dashboards. Exception-first.**

- **Headline**: "**6 decisions need your attention**"
- **Sub-line**: "AI is **94% confident** on the rest." — reinforces system control
- **Decision cards** (Signal cards) below, sorted by AI confidence (lowest first):
  - Each card shows: WHO (avatar + location badge), WHAT (item + amount), WHY flagged (human-readable tag like "Funding uncertain" or "Above auto-limit"), and the **confidence spectrum bar** on the left edge
  - Reason tags are color-coded: amber for "needs clarity", soft red for "flagged"
- **Expanding a card** → side panel with: full AI reasoning, receipt image, 4-point compliance breakdown, and actions: **Approve / Ask Anouk / Reassign / Reject**
- **Collapsed section below**: "**38 auto-approved today**" — expandable to reveal the **"Wow" moment**: a breakdown showing "Auto-approved based on: Policy match (100%) · Historical similarity · Funding eligibility · Receipt validation" — this is the demo's AI authority proof point
- **Minimal filters**: By flag reason, location, funding stream. No elaborate filter bar.

---

## Sarah's View — Procurement Officer

**AI-assisted procurement, not a Kanban board.**

- **Headline**: "**4 signals awaiting your action**"
- **Three action-oriented lanes**:
  - **Awaiting Action**: Requests needing supplier assignment. Each card shows AI supplier suggestion with **confidence spectrum bar** + **"Best value" tag** when applicable + cost comparison hint (e.g., "€12 cheaper than last order")
  - **In Motion**: Orders placed, deliveries en route. Expected dates visible. **Bottleneck highlighting**: amber accent + reason tag if delayed ("Supplier hasn't confirmed")
  - **Complete**: Recent deliveries confirmed, three-way match status shown as a simple ✓/⚠ indicator
- **Quick actions per card**: Assign supplier, update status, flag issue
- AI feels structural here — it's recommending suppliers, flagging delays, suggesting alternatives

---

## Jolanda's View — Team Lead

**Approval-focused. Her location, her team.**

- **Headline**: "**3 requests need your approval**"
- **Approval cards**: Each shows requester avatar + name, what they need, AI reasoning summary, confidence spectrum bar, and one-tap **Approve / Ask More / Reject**
- **Below approvals**: A compact location status line — "Your location today: €340 spent · 2 items in motion · 1 flagged" — not a dashboard, just a glanceable sentence
- **Team activity feed**: Recent Signals from her care workers with human-friendly statuses ("Anouk submitted a receipt · Waiting for finance")

---

## The "Wow" Demo Moment — Live Signal Flow-Through

Built into the mock data: when demoing, the presenter can:
1. Start as **Anouk** → tap "Start" → describe a purchase → submit
2. Switch to **Rohan** → the same Signal appears in his decision queue with AI confidence calculated, auto-categorized, flagged with a reason
3. This end-to-end story demonstrates the entire system in 30 seconds

This is achieved with pre-populated mock state that simulates this flow visually.

---

## Design Language

- **Naming**: "Signals" not transactions. "Decisions" not exceptions. "Needs clarity" not pending. "Human-required moment" not approval queue.
- **AI presence is calm, not performative**: Confidence bars speak louder than text. AI reasoning is expandable, never shouty. The system feels inevitable, not gimmicky.
- **Visual style**: Muted neutral palette (warm grays, off-white). Status colors used sparingly: green (sorted), amber (attention), soft red (flagged). Generous whitespace. Strong typography hierarchy — one large headline per view.
- **Animations**: Structural morph on role switch (cards reshape/reflow). Subtle scale-in on card hover. Smooth expand/collapse. Pulse dot on active Signals.
- **Mock data**: Realistic Dutch care scenarios — Thomas's bike (€150, Wlz), Lidl umbrella (€8.50), plumber repair (€340, above limit), Jumbo groceries (mixed funding).
- **Quality bar**: Linear confidence, Notion simplicity, modern enterprise minimalism. Board-demo ready.

