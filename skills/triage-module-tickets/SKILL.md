---
name: "Triage Module Tickets"
description: "Pull Trello cards relevant to the current project's functional modules. Read-only — never edits, comments, or modifies cards. Groups results by module, phase, and priority, surfaces blockers, and outputs a clean punch list."
---

# Triage Module Tickets (Trello Version)

## What This Skill Does

Queries the Trello board matching the current project name (e.g., `ylc-admin`, `younglivingconnect-backend`, etc.) for cards currently in the **To Do** or **Doing** lists.

**Strictly read-only.** This skill MUST NOT call any Trello write tools (`update_card`, `move_card_to_list`, `add_comment_to_card`, `delete_card`). Pulling, reading, and reporting only.

## Board Resolution

Before fetching cards, resolve the Trello Board ID:
1.  Identify the current project directory name (e.g. `ylc-admin`, `inspection-element-app`).
2.  Call `mcp__trello__get_boards()`.
3.  Find the matching board:
    - Prefer an exact name match (case-insensitive).
    - Fallback: Find a board whose name is contained within or contains the folder name.
    - Special mappings: `workplay-*` maps to `Exectras HR`, `ylc-*` maps to `YLC`.
4.  Use this Board ID for all subsequent calls.

## Module → Filter Mapping

Since this is a universal skill, deduce the "Modules" from the project's directory structure (e.g., folder names in `apps/` or `packages/`) and the existing labels on the Trello board.

- **Primary labels**: Look for labels like `area:*`, `feature:*`, or `module:*`.
- **Keyword fallback**: Use the module name in the `search_cards` query.

**Example Modules for YLC:**
- Dashboard
- Auth
- Mobile UI
- Backend API

**Example Modules for Inspection:**
- Form Builder
- Reports
- Admin Portal

## Priority Reference (Trello Labels)

- `Urgent` = P1
- `High` = P2
- `Normal` = P3
- `Low` = P4
- `No Label` = None

## Source Lists

The "To Do" and "Doing" lists on this board are where ready-to-work tickets live. When calling `get_cards_in_list`, fetch from both lists.

## Execution Steps

### 1. Pull To Do and Doing cards per module

For each module, run `mcp__trello__get_cards_in_list` for both:
- `listId`: (ID for "To Do")
- `listId`: (ID for "Doing")

Run **two passes per module**:

**Pass A — label-based** (Filter results by label names):
```
get_cards_in_list({ listId }) // then filter by labels in memory
```

**Pass B — keyword-based** (Search within card names/descriptions):
```
search_cards({ query: "<keyword>", boardId })
```

Run all necessary Trello calls in **parallel** in a single message.

### 2. Deduplicate

Same card may match multiple filters. Deduplicate by card `id`. Track which module(s) each card mapped to.

### 2b. Hard filter — unassigned + no person-bracket prefix

After dedup, drop any card that doesn't pass **both** of these gates:

1. **Unassigned or Hamza-only.** `idMembers` must be empty OR must only contain the ID for `hamzaahmad3006@gmail.com`. If the card is assigned to anyone else (e.g., Muhammad, Mohsin, etc.), drop it.
2. **Title must not start with a person-bracket prefix.** Drop the card if its title begins with any of:
   - `[Muhammad]`
   - `[Stefano]`
   - `[Mohsin]`
   - `[Reza]`

   Match case-insensitively.

Both filters are AND-combined. Apply this filter **before** sorting.

### 3. Resolve Checklists & Attachments

For any card suspected to have blockers or detailed AC, call:
```
get_card({ id })
```
Use checklists for Acceptance Criteria and "Blocked By" info in the description.

### 4. Bucket the output

**Group by module → phase → priority.**

**Phases** (ordered):

1. **Phase 1 — Foundations** — schema/data-layer, auth, RBAC, design system, infra.
2. **Phase 2 — Core feature work** — main user-facing functionality of the module.
3. **Phase 3 — Polish / UX / a11y** — polish, UX, accessibility improvements.
4. **Phase 4 — Nice-to-haves** — low priority or optional improvements.

### 5. Render the report

Format:

```
# Triage Cards — Trello Module Report

_Pulled <ISO date>. Read-only audit. No cards modified._

---

## POS module (<count> cards)

### Phase 1 — Foundations
- **[Card ShortLink]** P1 — Title here
  - Labels: `area:pos`, `Bug`
  - Blocked by: "Blocker info from description"
  - Link: https://trello.com/c/...

### Phase 2 — Core feature work
- ...
```

### 6. Summary footer

End with:

```
## Summary

- Total unique triage cards across modules: <N>
- Blocked cards: <N>
- P1/P2 count: <N>
```

## Hard Rules

1. **Read-only.** Never call any Trello `update_*`, `add_*`, or `delete_*` tools.
2. **No code changes.** This skill does not touch the repo.
3. **Use the board matching the current project**.
4. **Do not invent card IDs.**
5. **To Do or Doing lists only.** Do not include cards in `Backlog`, `Review`, or `Done`. If a card is in `Doing`, it must be assigned to `hamzaahmad3006@gmail.com`.
6. **Unassigned or Hamza-only.** Drop any card with members other than `hamzaahmad3006@gmail.com`.
7. **No person-bracket titles.** Drop any card whose title starts with `[Muhammad]`, `[Stefano]`, `[Mohsin]`, or `[Reza]`.

## Codebase Reference

Duce the codebase structure by listing the root directory. Common patterns:
- `apps/*`
- `packages/*`
- `src/features/*`

Only consult these to *judge fit*; do not read or modify them.
