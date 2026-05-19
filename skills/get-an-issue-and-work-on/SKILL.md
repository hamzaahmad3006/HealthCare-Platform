---
name: "Get An Issue And Work On"
description: "Pick the single highest-priority Trello card from the To Do or Doing list for the current app via the Triage Module Tickets skill, claim it (add member hamzaahmad3006@gmail.com, move to Doing list if not already there), fix it on a fresh feature branch under git user hamzaahmad3006 <hamzaahmad3006@gmail.com> inside a dedicated worktree, run thorough QA against the card's acceptance criteria, run an independent pre-commit code review and resolve all blockers, commit locally, push the branch, open a PR using the repo's PR template + recent-merged-PR conventions, then move the card to Review. One card = one branch = one worktree, always."
---

# Get An Issue And Work On (Trello Version)

## What This Skill Does

End-to-end single-ticket workflow that runs in **its own git worktree** so multiple agents can work on different cards in parallel without disturbing each other or the user's primary checkout.

1. Invokes the **Triage Module Tickets** skill to obtain the prioritized punch list from the **To Do** list.
2. Verifies the user's **Doing** load is below the cap (≤ 3 cards) before claiming a new one.
3. Picks **exactly one** card — the highest-priority unblocked starter from **To Do** or **Doing** that no other worktree session has already claimed (claim = an existing worktree path or local branch for that card ID). Priority is given to cards already in **Doing** assigned to Hamza.
4. Verifies the card's claims against the actual codebase before changing anything.
5. **Assigns** the card to `hamzaahmad3006@gmail.com` and moves it to **Doing** in Trello.
6. **Creates a dedicated git worktree** at `../<project-name>-worktrees/<type>-<n>-<slug>/` with a brand-new feature branch off `origin/main`.
7. Operates entirely inside that worktree from this point on. The user's primary checkout stays untouched.
8. Implements the fix per the card's instructions and acceptance criteria.
9. Runs thorough QA — typecheck, lint, tests, AC walkthrough, brand-token check, worktree containment.
10. Runs an **independent pre-commit code review** on the diff (separate reviewer subagent) and resolves every blocker before the change is committed.
11. Commits locally as **hamzaahmad3006 <hamzaahmad3006@gmail.com>** inside the worktree.
12. **Pushes** the feature branch to `origin`.
13. **Opens a PR** with title + description that follow the repo's PR template and the prevailing tone of recent merged PRs.
14. Moves the Trello card to **Review**.
15. Reports the worktree path, branch, commit SHA, PR URL, QA matrix, and code-review summary.

## Why Worktrees

Multiple parallel agents (or the user themselves) can run this skill simultaneously:

- Each agent gets its own checkout, its own `node_modules`, its own dev server, its own working tree.
- The user's primary repo checkout never has its `HEAD` switched out from under them.
- Branches share `.git`, so commits and remotes are visible everywhere via `git log --all` / `git branch -a`.
- Cleanup is one command: `git worktree remove`.

## Hard Rules

1. **Exactly one card per run.** If two cards look equally important, pick the lower numeric ID and ignore the other.
2. **One branch per card. One worktree per card.** Never reuse either. Never bundle two cards in one branch.
3. **Worktree isolation is mandatory.** Never run `git checkout`, edits, or commits in the user's primary checkout. All work happens inside the worktree path.
4. **Claim before working.** Before picking, list existing worktrees AND `git branch --list 'fix/sou-*' 'feat/sou-*' …` AND any `origin/<type>/sou-*` remote branches. If `sou-<n>-*` appears anywhere — local worktree, local branch, or remote branch — that card is already claimed. Skip it.
5. **In-Progress cap is 3.** Before claiming a new card, count Trello cards currently in list **Doing** assigned to `hamzaahmad3006@gmail.com`. If the count is ≥ 3, **stop** with a message listing those 3 cards and asking the user to finish or de-claim one before starting another.
6. **Trello writes are limited to list + member transitions on the card being worked.** Allowed: `mcp__trello__update_card` to set member + list to **Doing** (Step 5) and list to **Review** (Step 14). **Forbidden:** any `create_card`, `delete_card`, `save_comment`, `create_label`, `create_attachment`. Never edit the card's title or description.
7. **Git identity is per-commit, not global.** Use `git -c user.name=hamzaahmad3006 -c user.email=hamzaahmad3006@gmail.com commit ...` so this skill never overwrites the user's global git config. Do not run `git config --global ...` ever.
8. **Verify before editing.** If the card references a file path, function, route, or schema, confirm it exists in the worktree. If it does not exist or has materially diverged, stop and report — do not invent a fix.
9. **Respect protected modules** (per `CLAUDE.md`): Delivery, gift cards/rewards/subscriptions/coupons, Meilisearch/SEO, tax engine, Stripe reconciler, existing QB sync, image processor, email automation worker, customer merge, barcode scanning, receipt printing, RBAC middleware structure. If the picked card touches one of these, **skip it** and pick the next.
10. **Push only the feature branch, never `main`, never force-push.** No `--force`, no `--force-with-lease`, no pushes to `main` or any other branch. Never run `gh pr merge`, `gh pr review --approve`, `gh release …`, or anything that lands code.
11. **No credentials, no secrets in commits.**
12. **QA is non-negotiable.** A run is not "done" until QA passes. If QA fails after fixing, keep iterating; do not commit broken code. Do not delete the worktree on failure — leave it for the user to inspect, and roll back the Doing claim only if work was never started.
13. **Code-only QA is not enough.** For any change touching a user-visible surface (page, route, component, form, toast, popover, layout), the skill **must** boot the dev server and drive the change with Playwright in a real browser before committing. See Step 9g. Skipping browser QA on a UI card is a hard violation; "I read the code and it looks right" does not satisfy this rule.
14. **Pre-commit code review is mandatory.** After QA passes, run an independent reviewer subagent over the diff (Step 10) and resolve every blocker before the commit. The point is to catch convention drift, subtle bugs, scope creep, and security issues *before* they reach the PR — not after a reviewer flags them on GitHub. Skipping or rubber-stamping the reviewer pass is a hard violation. If the reviewer is unavailable (subagent error), fall back to the inline checklist in Step 10e and document the fallback in the AC report.
15. **Never commit the skills folder.** The `skills/` directory must NEVER be added to git, committed, or pushed. It is local-only automation.

## Worktree & Branch Conventions

- **Worktree root:** `../<project-name>-worktrees/` (sibling of the main repo).
- **Worktree directory:** `<type>-<n>-<kebab-slug>` (e.g. `fix-12-bell-icon-a11y`).
- **Branch name:** `<type>/<ticket-id>-<kebab-slug>` (e.g. `fix/12-bell-icon-a11y`).
  - `<type>` ∈ `feat | fix | chore | refactor | a11y | perf | test | docs`
- **Branch base:** always `origin/main` (freshly fetched), never local `main`.

## Board Resolution

Before fetching or claiming cards, resolve the Trello Board ID:
1.  Identify the current project directory name (e.g. `ylc-admin`, `inspection-element-app`).
2.  Call `mcp__trello__get_boards()`.
3.  Find the matching board:
    - Prefer an exact name match (case-insensitive).
    - Fallback: Find a board whose name is contained within or contains the folder name.
    - Special mappings: `workplay-*` maps to `Exectras HR`, `ylc-*` maps to `YLC`.
4.  Use this Board ID for all subsequent calls.

### Manual Fallback (If Trello MCP is not connected)
If Trello tools are unavailable:
- Ask the user for the Ticket Title, Description, and Acceptance Criteria.
- Skip Step 5 (Trello claim) and Step 14 (Trello move).
- The user will handle Trello status updates manually.

## Trello Board Structure

This skill assumes the team's Trello board has these lists (verified at SKILL build time):

| List Name | When this skill uses it                                  |
|-----------|----------------------------------------------------------|
| **To Do** / `Doing` | Where the card lives before this skill picks it |
| `Doing`   | Set in Step 5 (claim)                                    |
| `Review`  | Set in Step 14 (after PR is open)                        |
| `Done`    | **Never** set by this skill — that's the merger's job    |

If the team's list list ever drifts from these names, stop and report — don't guess at substitutes.

## Workflow

### Step 1 — Pre-flight (in the primary repo)

You may be invoked from the user's primary checkout *or* from inside an existing worktree. Resolve the canonical repo root and verify state without disturbing whatever HEAD the caller is on.

```bash
PRIMARY_ROOT="$(git rev-parse --show-toplevel)"
COMMON_DIR="$(git rev-parse --git-common-dir)"
cd "$PRIMARY_ROOT"

# Fetch latest main + remote branches without changing any checkout
git fetch origin main --prune
git fetch origin --tags --prune

# Build the claim set — local worktrees + local SOU branches + remote SOU branches
git worktree list --porcelain
git branch --list 'fix/sou-*' 'feat/sou-*' 'chore/sou-*' 'refactor/sou-*' 'a11y/sou-*' 'perf/sou-*' 'test/sou-*' 'docs/sou-*'
git branch -r --list 'origin/fix/sou-*' 'origin/feat/sou-*' 'origin/chore/sou-*' 'origin/refactor/sou-*' 'origin/a11y/sou-*' 'origin/perf/sou-*' 'origin/test/sou-*' 'origin/docs/sou-*'
```

Extract the SOU-IDs from these into a "claimed" set used in Step 4.

If `git fetch` fails (e.g. no network), stop and report.

### Step 2 — Verify In-Progress cap (≤ 3 active)

```javascript
mcp__trello__get_cards_in_list({
  listId: "ID_FOR_DOING_LIST",
})
```

If the returned list has length ≥ 3, **stop** with this exact message:

```
In-Progress cap reached (3/3). The following cards are already in Doing
assigned to hamzaahmad3006@gmail.com:

  - SOU-AAA: <title>
  - SOU-BBB: <title>
  - SOU-CCC: <title>

Move one to Review (open its PR) or back to To Do before starting another.
```

Otherwise note the current count (e.g. "2/3 in flight, can claim 1 more") and continue.

### Step 3 — Run the issue finder

Invoke the **Triage Module Tickets** skill. Its "🟢 Recommended Starters" section is the candidate pool.

### Step 4 — Pick exactly one card (claim-aware)

Picking algorithm (deterministic, stop at first match):

1. **Already-claimed filter.** Skip any candidate whose SOU-ID appears in the claim set built in Step 1 (local worktree, local branch, or remote branch).
2. **Already-Doing-or-Review filter.** Even if no branch exists, skip candidates whose Trello list is anything other than **To Do** or **Doing** (if assigned to Hamza) — another agent may have claimed in Trello without yet creating a branch.
3. Highest priority label (Urgent before High).
4. Within same priority, prefer cards with **no upstream dependency** in the title or description ("depends on SOU-XXX" if SOU-XXX is not yet `Done`).
5. Within same priority + unblocked, prefer **smallest scope** (estimate ≤ 2 points if available, or shortest title).
6. Skip any card whose scope touches a **protected module** (rule 9).
7. Skip cards labelled `verification-only` — those are audit reports, not code work.
8. Tie-break by lowest numeric ID.

Announce: `Picked SOU-XXX — <title> — P<n>`.

If every candidate is already claimed/in-progress, report and stop.

### Step 5 — Pull full card detail + claim it in Trello

Get card detail (description, checklists). If `blockedBy` is non-empty and any blocker is not `Done`, drop and re-pick.

**Now claim it in Trello** (this is the "no two agents work the same card" gate before the worktree exists):

```javascript
mcp__trello__update_card({
  id: "CARD_ID",
  idList: "ID_FOR_DOING_LIST",
  idMembers: ["ID_FOR_HAMZA"] // Ensure Hamza is assigned
})
```

Confirm the response shows `idList` is the Doing list and `idMembers` includes hamzaahmad3006@gmail.com. If the card was already assigned to Hamza, this call just moves it to **Doing**. If the assignee was already someone else, **stop and report** — do not steal another person's card.

### Step 6 — Create the worktree

Compute names:

```bash
SLUG="bell-icon-a11y"
TYPE="fix"
PROJECT_NAME="$(basename "$PRIMARY_ROOT")"
BRANCH="${TYPE}/${TICKET}-${SLUG}"
WORKTREE_PARENT="$(dirname "$PRIMARY_ROOT")/${PROJECT_NAME}-worktrees"
WORKTREE_PATH="${WORKTREE_PARENT}/${TYPE}-${TICKET}-${SLUG}"
```

Refuse if the worktree path or branch already exists locally OR if `origin/<branch>` exists remotely — re-pick once. (This is a second-line check; the primary collision guard is the Trello claim in Step 5.)

```bash
mkdir -p "$WORKTREE_PARENT"
git -C "$PRIMARY_ROOT" worktree add -b "$BRANCH" "$WORKTREE_PATH" origin/main
cd "$WORKTREE_PATH"
git rev-parse --abbrev-ref HEAD     # → ${BRANCH}
git rev-parse --show-toplevel       # → ${WORKTREE_PATH}
```

Install deps if the change requires running tooling:

```bash
pnpm install --prefer-offline --frozen-lockfile
```

#### Step 6b — Bring the local stack up to the worktree's branch state

The worktree's branch is freshly checked out from `origin/main`, but the local Supabase database may be at any prior schema version (left over from previous worktrees). Bring it into alignment **before** any QA runs.

##### 6b.i — Pre-flight checks

```bash
docker info >/dev/null 2>&1 || { echo "Docker Desktop is not running — start it before continuing"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm not on PATH"; exit 1; }
command -v supabase >/dev/null || { echo "supabase CLI not on PATH (brew install supabase/tap/supabase)"; exit 1; }
```

If Docker isn't running, stop and report. The skill cannot start the stack without it.

##### 6b.ii — Start Supabase (idempotent)

```bash
supabase status >/dev/null 2>&1 || supabase start
```

`supabase start` is a no-op if the local stack is already up. Wait for it to settle before migrating:

```bash
for i in {1..30}; do supabase status >/dev/null 2>&1 && break; sleep 1; done
```

Supabase Studio will be at `http://127.0.0.1:54323` once up.

##### 6b.iii — Apply migrations (If applicable)

If the project uses a database (Supabase/Drizzle), align the DB with the branch:

```bash
# Example for Drizzle/Supabase
pnpm run db:migrate
```

### Step 7 — Verify the card against the codebase

For each cited path / symbol:

```bash
ls -la <path>
grep -rn "<symbol>" <expected-package>
```

If verification fails, **release the claim cleanly** and re-pick:

```bash
cd "$PRIMARY_ROOT"
git worktree remove --force "$WORKTREE_PATH"
git branch -D "$BRANCH"
```

Then in Trello, **revert the claim**: move back to **To Do**, remove `hamzaahmad3006@gmail.com` from members.

### Step 8 — Implement the fix

Stay surgical. Match `CLAUDE.md` conventions:

- NuHQ brand tokens from `packages/ui/`, never hardcoded hex.
- Drizzle `pgTable` patterns for schema.
- Existing `PermissionGate` for RBAC.
- Co-located Vitest tests for new helpers/endpoints.
- Existing UI primitives.

### Step 9 — QA (non-negotiable, all inside the worktree)

(QA procedures 9a–9j remain as defined in the project, including browser-based functional verification for UI changes, Playwright scripts, etc.)

### Step 10 — Pre-commit code review (independent reviewer pass)

(Code review procedures 10a–10g remain as defined in the project.)

### Step 11 — Commit (locally, inside the worktree)

```bash
git add <only the files you intended to change>
git -c user.name=hamzaahmad3006 -c user.email=hamzaahmad3006@gmail.com commit -m "$(cat <<'EOF'
<type>(<scope>): <short summary>

<body — what changed and why, referencing [SOU-XXX](https://trello.com/c/CARD_SHORT_LINK)>

Refs: SOU-XXX
EOF
)"
git log -1 --format="%h %an <%ae> %s"
```

### Step 12 — Push the feature branch

```bash
git push -u origin "$BRANCH"
```

### Step 13 — Open the PR

#### 13a. Construct the title

```
<type>(<scope>): <imperative summary> [SOU-NNN]
```

#### 13b. Construct the body

Fill the `.github/pull_request_template.md` template. Reference the Trello card via full URL: `https://trello.com/c/CARD_SHORT_LINK`.

#### 13c. Create the PR

```bash
gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "<computed title>" \
  --body "$(cat <<'EOF'
<computed body>
EOF
)"
```

Capture the returned PR URL. If `gh pr create` fails (e.g. no `gh` auth, branch protection, missing remote), stop and report — leave the worktree and the Trello Doing state alone.

**Do not** run `gh pr merge`, `--auto`, `--squash`, or any approval/review/merge flag. Opening the PR is the end of this skill's GitHub interaction.

### Step 14 — Move the card to Review

```javascript
mcp__trello__update_card({
  id: "CARD_ID",
  idList: "ID_FOR_REVIEW_LIST",
})
```

Confirm response shows the new `idList`. Do not change the members here — keep it as `hamzaahmad3006@gmail.com`.

If this call fails (e.g. transient Trello API error), retry once. If it still fails, report the failure but leave the PR open — the human can flip the state manually.

### Step 15 — Final report

```
## ✅ Done — SOU-XXX

**Ticket:** <title>
**Worktree:** <absolute path>
**Branch:** <branch-name>
**Commit:** <short-sha> <subject>
**Author:** hamzaahmad3006 <hamzaahmad3006@gmail.com>
**PR:** <PR URL>
**Trello state:** To Do → Doing → Review

### Changes
- <file 1> — <one-line summary>
- <file 2> — <one-line summary>

### QA results
- typecheck: ✅
- lint: ✅
- tests: ✅ (X passed, Y new) — or ⚠️ no Vitest in <package>
- browser QA: ✅ Playwright spec `e2e/.qa/sou-NNN.spec.ts` passed against local dev server
  - screenshots: `.qa/sou-NNN/<viewport>.png` (in worktree, not committed)
  - or ⚠️ Skipped — diff is API-only, no user-visible surface (rule 13 exemption)
- code review (Step 10): ✅
  - reviewer: <reviewer | code-analyzer | analyst | inline-fallback>
  - iterations: <n>
  - blockers resolved: <count>
  - warnings accepted: <count> / declined: <count, with reason>
  - final BLOCKERS: 0
- AC1: ✅ <how — cite Playwright assertion, file:line, or screenshot path>
- AC2: ⚠️ Manual verification required
- ...

### Next steps (manual)

# Once the PR is reviewed and merged, clean up:
git -C <primary-repo> worktree remove <worktree-path>
git -C <primary-repo> branch -D <branch-name>

# Trello card should be moved to Done when the PR is merged via integration or manually.
```

**Stop after the report.** Do not start another card. Do not push again. Do not merge. Do not remove the worktree.

## Parallel Operation

Two or more agents can run this skill simultaneously. There are now **three** anti-collision gates:

1. **Trello state.** Step 4 filters out anything not in **To Do**. Step 5's `update_card` to `Doing` flips list atomically — second agent racing for the same card will see it's no longer in **To Do** next time it queries.
2. **Local worktree + branch.** Step 1 enumerates `git worktree list` + `git branch --list 'fix/sou-*' …`; Step 4 filters those out. Step 6's `git worktree add -b` is atomic and refuses to clobber an existing branch or directory.
3. **Remote branch.** Step 1 also lists `git branch -r --list 'origin/<type>/sou-*'` — covers the case where another agent already pushed a branch but this checkout hasn't been merged yet.

The In-Progress cap (rule 5) bounds parallelism: at most 3 active claims per user.

The user's primary checkout is never touched. Branch listing (`git branch --list 'fix/sou-*'`) and worktree listing (`git worktree list`) make in-flight work visible from any checkout.

## Edge Cases

- **No cards returned by the issue finder:** report and stop.
- **In-Progress cap hit:** report the 3 in-flight cards, stop. Don't auto-de-claim anything.
- **All P1/P2 cards already claimed (worktree, branch, or non-To Do Trello state):** report claim list, stop. Don't fall back to lower-priority without explicit user opt-in.
- **`git worktree add` fails (race):** revert Trello claim back to **To Do**/no member, re-pick once.
- **Verification fails:** revert Trello claim, remove worktree, re-pick once.
- **`gh pr create` fails:** leave the worktree and Trello state at `Doing`, report — user can open the PR manually.
- **`update_card` to `Review` fails:** PR is already open, report the failure and tell the user to flip the state manually.
- **QA repeatedly fails after fixes:** stop after 3 fix-and-rerun cycles, report the failure pattern, leave the worktree in place, leave Trello at `Doing`. Do not force-pass QA. Do not push.
- **Card scope > 5 points or spans multiple subsystems:** decline and re-pick. This skill is one-PR-sized.
- **`gh` not authenticated:** stop at Step 13, report `gh auth status` output, leave Trello at `Doing`.
- **Code reviewer flags STOP (protected module / secrets / destructive migration):** halt, restore Trello to **To Do**, remove worktree+branch, report to user.
- **Code reviewer keeps finding new BLOCKERs after 3 iterations:** stop, leave the worktree, leave Trello at `Doing`, report the pattern. Don't keep iterating.
- **Reviewer subagent unavailable:** fall back to the inline checklist in Step 10e, document the fallback in the AC report, and continue. Do **not** skip the review.

## Invocation

Trigger phrases that should run this skill:
- "get an issue and work on"
- "pick a triage ticket and fix it"
- "/get-an-issue-and-work-on"
