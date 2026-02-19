# Pulse Demo Flow — HackaTom 2026

> **One clear idea**: Pulse is the "one-door policy" for healthcare operations — AI handles the routine so care workers can focus on care.

---

## 🎯 The Story in One Sentence

*"From a care worker snapping a receipt to a finance admin reconciling invoices, Pulse orchestrates the entire flow with AI — eliminating paperwork, reducing cognitive load, and giving everyone clarity on what needs attention."*

---

## 👥 Personas (Switch via floating button, top-right)

| Persona | Role | Focus | Demo Highlight |
|---------|------|-------|----------------|
| **Anouk** | Care Worker | Get things done | Voice/photo input, auto-classification |
| **Jolanda** | Team Lead | Approvals | Budget oversight, approve/reject decisions |
| **Rohan** | Finance Admin | Control risk | Three-way match, exception triage |
| **Sarah** | Procurement | Supply continuity | PO generation, vendor matching |

---

## 🎬 Demo Script (5-7 minutes)

### ACT 1: The Care Worker Experience (Anouk) — 90 seconds

**Setup**: *"Meet Anouk. She's a care worker at Zonneweide. She just bought cleaning supplies for a resident and needs to log it."*

#### Steps:
1. **Show the clean mobile-first interface**
   - Point out: No complex forms, just a simple input bar at the bottom
   - "One door for everything — voice, camera, or text"

2. **Tap a Quick-Tap pill** (e.g., "Order supplies")
   - Template pre-fills: "I need to order: "
   - Type: "blue cleaning wipes for Ward B"
   - **Hit send**

3. **Watch AI classification toast**
   - First toast: "📝 New request created — AI is classifying it now"
   - Second toast (2s later): "🤖 AI classified your request — Category: Supplies · Routed to: Procurement · Budget: Wlz"

4. **Tap the 🤖 AI button** (bottom right of a card)
   - AI Copilot overlay opens
   - Walk through the 3-step conversation:
     - "Hey Anouk! I've matched it to Ward B's hygiene budget"
     - "GL code auto-filled: 4210 — under €50 threshold"
     - "Done! ✅ Procurement will handle ordering"

5. **Show "Needs Input" card** (if one exists)
   - Tap "Provide info" → Card resolves with toast
   - *"Anouk doesn't chase paperwork — the system tells her exactly what's blocking"*

**Key message**: *"Anouk spent 30 seconds. No forms, no GL codes to memorize, no chasing approvals."*

---

### ACT 2: The Team Lead View (Jolanda) — 90 seconds

**Transition**: *"Now let's see what Jolanda, the team lead, sees. She's responsible for budget oversight and approvals."*

#### Steps:
1. **Switch persona** (floating switcher → Jolanda)
   - Page scrolls to top, shows budget dashboard

2. **Point out the budget cards**
   - Three locations with spend vs budget
   - Trend indicators (+8%, -3%, +12%)
   - *"At a glance, she knows Het Anker is running hot"*

3. **Show the decision queue**
   - Cards with AI risk classification (flagged items highlighted)
   - Amount, submitter, AI reasoning visible

4. **Approve an item**
   - Tap ✅ Approve on a medical gloves request
   - Toast: "✅ Approved — sent to procurement"
   - Follow-up toast: "📦 Order initiated — Sarah has started processing"

5. **Tap "AI Insights" button**
   - Walk through Jolanda's AI script:
     - "Ward C spending 34% above average"
     - "Recommend: approve gloves, flag bedding for quote"
     - AI takes action, moves items appropriately

**Key message**: *"Jolanda makes decisions, not paperwork. AI surfaces what matters and explains why."*

---

### ACT 3: The Finance View (Rohan) — 90 seconds

**Transition**: *"Behind the scenes, Rohan in finance needs to reconcile everything. Let's see his world."*

#### Steps:
1. **Switch persona** (→ Rohan)
   - Shows exception-based triage view

2. **Point out the tabs**
   - Exceptions (6) | Approvals (3) | Monitoring
   - *"Rohan only sees what needs attention — not every transaction"*

3. **Show a three-way match exception**
   - Invoice vs PO variance highlighted
   - AI reasoning: "MedSupply variance within historical pattern"

4. **Reconcile an item**
   - Tap "Reconcile" button
   - Toast confirms resolution

5. **Use filters**
   - Click Filters button
   - Filter by Risk Level: High
   - *"He can slice and dice by risk, amount, or date"*

6. **Tap "AI triage" button**
   - Walk through Rohan's AI script:
     - "12 auto-matched, 5 need attention"
     - "Auto-resolve low-risk" → clears 3 items
     - "Total exposure reduced from €1,240 to €407"

**Key message**: *"Rohan's job is exception handling, not data entry. AI did the matching; he validates the edge cases."*

---

### ACT 4: The Procurement View (Sarah) — 60 seconds

**Transition**: *"Finally, Sarah in procurement turns approvals into orders."*

#### Steps:
1. **Switch persona** (→ Sarah)
   - Shows order pipeline and vendor suggestions

2. **Point out active orders**
   - Shipped, Processing, Delivered status
   - ETA and tracking visible

3. **Show AI vendor suggestion**
   - "MedSupply NL — 96% match, save €12.40"
   - Tap "Assign" → Toast confirms

4. **Show auto-PO candidates**
   - Items within threshold ready for one-click PO
   - *"Recurring items auto-generate — Sarah just validates"*

5. **Tap AI button** for Sarah's script
   - "2 auto-POs ready, 1 order shipped"
   - "Generate both POs" → Done!

**Key message**: *"Sarah's not typing POs — she's managing exceptions and vendor relationships."*

---

### CLOSING: The Big Picture — 30 seconds

**Switch back to Anouk** (or show landing page)

*"What you just saw:*
- *A care worker logged a purchase in 30 seconds*
- *AI classified it, routed it, and filled in the GL code*
- *The team lead approved it with full context*
- *Finance reconciled it automatically*
- *Procurement generated the PO*

*All without a single form, a single email chase, or a single 'what's the status?' question.*

*This is Pulse — the one-door policy for healthcare operations."*

---

## ✅ Demo Checklist

### Before the Demo
- [ ] Open app at landing page (pulse-prototype.netlify.app or localhost)
- [ ] Click "See how it works" to enter dashboard
- [ ] Ensure persona switcher shows all 4 avatars
- [ ] Have some signals in the database (or use demo data)

### During the Demo
- [ ] Use persona switcher (top-right) to switch views
- [ ] Let toasts complete before moving on
- [ ] Click AI buttons to show copilot conversations
- [ ] Approve/reconcile items to show state changes

### Key Interactions That Work
| Action | Location | Result |
|--------|----------|--------|
| Quick-Tap pill | Anouk input bar | Pre-fills template |
| Send message | Anouk input bar | Creates pulse + AI classification |
| Voice button | Anouk input bar | Simulates voice → fills input |
| Camera button | Anouk input bar | Toast (simulated) |
| Provide info | Anouk needs-input card | Resolves card |
| Ask AI | Any view | Opens AI Copilot overlay |
| Approve/Reject | Jolanda decision cards | Moves item, shows toast chain |
| Reconcile | Rohan exception list | Resolves match |
| Filter | Rohan view | Filters list by risk/amount/date |
| Assign supplier | Sarah queue | Confirms assignment |

---

## 🎤 Talking Points

### If asked about AI:
*"The AI isn't making decisions — it's doing the grunt work. Classification, matching, routing. Humans stay in control of approvals and exceptions."*

### If asked about integration:
*"Pulse sits on top of your existing ERP. It's the friendly front door that handles intake and orchestration, then syncs back to your systems of record."*

### If asked about security:
*"All data stays within your tenant. AI processing happens in-region. We're SOC2 compliant and working toward NEN 7510 for healthcare."*

### If asked about implementation:
*"Typical rollout is 4-6 weeks. We start with one location, train the AI on your patterns, then expand. Care workers are productive on day one."*

---

## 🚨 Known Limitations (Don't Demo These)

1. **Voice input** — Simulated (fills with preset text)
2. **Camera** — Toast only (no actual photo capture)
3. **Real AI classification** — Uses Supabase edge function (may have latency)
4. **Notifications** — Static demo data per role
5. **Search** — Works but limited to demo signals

---

## 💡 Pro Tips

1. **Start with Anouk** — Most relatable, shows the "one door" concept
2. **Don't rush the AI copilot** — Let each step land
3. **Use the persona switcher dramatically** — "Now let's see what happens on the other side..."
4. **End with the loop** — Show how Anouk's request flows through all 4 personas
5. **Keep it to 5-7 minutes** — Leave time for questions

---

*Good luck! 🚀*
