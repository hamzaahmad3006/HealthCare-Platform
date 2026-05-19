---
name: "End-of-Day Report"
description: "Compile a concise end-of-day report of today's developer work. Pulls from Trello (list transitions on cards assigned to hamzaahmad3006@gmail.com), GitHub (PRs opened/updated by hamzaahmad3006), and active worktrees. Renders a terse markdown report saves it to ../<project-name>-eod-reports/eod-YYYY-MM-DD.md."
---

# End-of-Day Report (Trello Version)

At end-of-day, compile a one-screen report of what the developer (hamzaahmad3006@gmail.com / git: hamzaahmad3006) actually did today. Sources:

1. **Trello** — cards assigned to `hamzaahmad3006@gmail.com` whose list changed today (e.g., To Do → Doing, Doing → Review, Review → Done) or whose activity is today.
2. **Git** — used internally only to attribute work to Card IDs via branch names and commit subjects. Commit hashes are NEVER rendered in the report.
3. **GitHub** — PRs opened, updated, or merged today by `@hamzaahmad3006` (via `gh pr list`), including the Vercel preview/production deployment URLs harvested from the `vercel[bot]` PR comments / status checks.
4. **Active worktrees** — anything in `../<project-name>-worktrees/` that still has uncommitted/unpushed work — flagged as "in flight".

## Execution

### Step 1 — Pre-flight

```bash
# Verify local environment
command -v gh >/dev/null || { echo "gh CLI not on PATH"; exit 1; }
```

### Step 2 — Pull Trello activity (If connected)

1. Call `mcp__trello__get_boards()` to list all boards.
2. For each relevant board, call `mcp__trello__get_board_activity({ boardId, since: "start-of-day-ISO" })`.
3. Aggregate results.

**Manual Fallback**: If Trello is not connected, ask the user: *"Hamza, any Trello cards moved today that weren't captured by PRs?"*

### Step 3 — Pull GitHub activity

```bash
gh pr list --author "@me" --state all --limit 20 --json number,title,url,updatedAt,state,isDraft,comments
```

For each matching PR, extract branch name (e.g. `fix/12-bell-icon-a11y`) → Card ID, plus `state` and `url`.

### Step 4 — Check Worktrees

```bash
PROJECT_NAME="$(basename $(git rev-parse --show-toplevel))"
ls -d ../${PROJECT_NAME}-worktrees/*/ 2>/dev/null | xargs -I {} sh -c 'cd {} && git status --porcelain'
```

Identify Card IDs from worktree directory names that have uncommitted work.

### Step 5 — Compile & Save

Construct the markdown and write it to `../${PROJECT_NAME}-eod-reports/eod-YYYY-MM-DD.md`.

Format:
```markdown
# EOD Report — YYYY-MM-DD — hamzaahmad3006

## ✅ Done
- **[Card Title]** — PR #<num> (<deploy-url>)
  - Moved from To Do → Doing/Review today.

## 🔄 In Progress
- **[Card Title]** — worktree: `sou-YYY-slug`
  - Active development; PR not yet opened or in draft.

## 🛑 Blockers / Next
- <list of cards assigned but blocked, or next items in backlog>
```

## Hard Rules

1. **Read-only.** Never commit, never push, never call any Trello `update_*` / `create_*` / `delete_*` tool.
2. **No creds.** Never include API keys or tokens in the report.
3. **No noise.** Omit internal chore PRs or dependabot noise unless the user specifically asks.
4. **Attribution.** Report Trello activity for `hamzaahmad3006@gmail.com` and GitHub activity for `hamzaahmad3006`.
5. **No invention.** Don't pad the report with work that isn't backed by a Trello action, commit, PR, or worktree.
6. **No third-party push.** Do not post the report to Slack/email/Trello. The skill saves the file and prints; the *user* decides where to send it.

## Edge Cases

- **No tracked work today:** report "No tracked work today (no PRs for hamzaahmad3006, no Trello list changes for hamzaahmad3006@gmail.com)."
- **Missing Trello MCP connection:** stop with a clear error pointing the user to reconnect Trello MCP.
- **`gh` not authenticated:** report worktrees and Trello activity but note "GitHub activity unavailable (not authenticated)".
