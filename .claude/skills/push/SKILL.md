---
name: push
description: Use when the user asks to commit and push changes. Inspects what changed in the session, derives a descriptive branch name, stages the right files, writes a conventional commit message, and pushes. Never commits to main.
---

# Push Changes

## Overview

Inspect what changed → derive branch name from the work → stage appropriate files → commit with a structured message → push.

**Announce at start:** "Using the push skill to branch, commit, and push."

---

## Step 1: Understand What Changed

Run these in parallel:

```bash
git status
git diff --stat
git branch --show-current
git log --oneline -5
```

Read the diff to understand the nature of the work — not just which files, but what category of change it is. This drives the branch name and commit message.

**Categories (pick the closest):**
| Work done | Branch prefix | Commit prefix |
|---|---|---|
| New feature or screen | `feat/` | `feat:` |
| Bug fix | `fix/` | `fix:` |
| Refactoring (no behaviour change) | `refactor/` | `refactor:` |
| Documentation / MD files only | `docs/` | `docs:` |
| Tests | `test/` | `test:` |
| Config, tooling, deps | `chore/` | `chore:` |
| Mixed (refactor + fix + docs) | Use the dominant category | Use the dominant prefix |

---

## Step 2: Decide Branch Strategy

**Check the current branch:**

- If already on `main` or `master` → must create a new branch
- If on `memory-update` or another non-feature branch → create a new branch
- If already on a relevant feature branch that matches the work → commit directly to it
- If on a feature branch that does NOT match the current work → create a new branch with a descriptive name derived from Step 3

**The match test:** Ask "would a stranger reading this branch name know it contains this commit?" If no, create a new branch. A branch named `onboarding-ui-revamp` does not match work done specifically on the sign-in screen — create `sign-in-ui-revamp` instead. Broad names like `ui-updates` or `fixes` always fail this test.

**Never commit directly to `main` or `master`.**

---

## Step 3: Derive Branch Name

Build the branch name from the category prefix + a short kebab-case description of the work. Keep it under 50 characters.

**Rules:**
- Describe WHAT was done, not HOW — `feat/error-boundary` not `feat/add-class-component-to-shared`
- One concept per branch — if work spans two unrelated areas, pick the dominant one
- No ticket numbers unless the user provides one

**Examples from this project:**
```
refactor/pressable-migration
docs/architecture-error-handling
fix/auth-provider-default-export
feat/logger-and-sentry-setup
chore/tanstack-query-install
```

---

## Step 4: Create Branch (if needed)

```bash
git checkout -b <branch-name>
```

If the branch already exists remotely, pull it first:
```bash
git checkout -b <branch-name> origin/<branch-name>
```

---

## Step 5: Stage the Right Files

Stage files that belong to the commit. Exclude:
- `.claude/worktrees/` — never commit worktree artifacts
- `.env`, `.env.local` — never commit secrets
- `node_modules/` — never commit dependencies
- Unrelated files the user didn't touch in this session

```bash
git add <specific files or folders>
```

Prefer explicit paths over `git add .` to avoid accidentally staging sensitive files. If the working tree is clean except for the session's work, `git add .` is acceptable — but verify with `git status` first.

---

## Step 6: Write the Commit Message

Structure:
```
<prefix>: <short imperative summary under 72 chars>

<body — what changed and why, 2-4 sentences. Focus on the WHY,
not the what (the diff shows the what). Mention any non-obvious
decisions or constraints.>
```

**Commit message rules:**
- First line: imperative mood ("add", "fix", "convert" — not "added", "fixes", "converting")
- First line: no period at the end
- Body: explain motivation, not mechanics
- Never reference the session, the user's name, or internal task IDs

**Good examples:**
```
refactor: replace TouchableOpacity with Pressable across all touchable elements

Migrates all styled.TouchableOpacity definitions to styled(Pressable) and
removes activeOpacity props which are not supported by Pressable. Updates
DESIGN.md to reflect the new standard pattern.
```

```
docs: add comprehensive error handling section to ARCHITECTURE.md

Defines the three-layer error handling strategy (service → hook → screen),
React Error Boundary pattern, global ErrorUtils handler, and the context
fields required in every logger.error call. Cross-references SECURITY.md
for the PII constraint rather than duplicating it.
```

Use a HEREDOC to avoid shell escaping issues:
```bash
git commit -m "$(cat <<'EOF'
<prefix>: <summary>

<body>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 7: Push

```bash
git push -u origin <branch-name>
```

The `-u` flag sets the upstream so future pushes on this branch need no arguments.

---

## Step 8: Report

Tell the user:
- Branch name created/used
- Files committed (count + summary)
- Commit message first line
- Whether push succeeded
- The GitHub PR creation URL if the remote echoes one

---

## Common Mistakes

**Committing to main**
- Never. Always branch first. If `git branch --show-current` returns `main`, stop and create a branch.

**Using `git add .` blindly**
- Always check `git status` first. `.claude/worktrees/` and `.env` files must never be staged.

**Vague branch names**
- `fix/bug` → bad. `fix/auth-provider-default-export` → good.

**Branch name doesn't match the work**
- Even on an existing feature branch, if the name doesn't accurately describe what's being committed, create a new branch first. Don't let commits accumulate under a misleading name just because the branch was already there.

**Vague commit messages**
- "update files" → bad. Describe the actual change and why.

**Committing MEMORY.md as part of feature work**
- `MEMORY.md` is a session log, not part of the feature. Only include it if the user explicitly asks for it to be committed.

**Mixing unrelated work in one commit**
- If the session touched two unrelated things (e.g., a refactor AND a bug fix), use two commits. Ask the user if unsure.

---

## Red Flags

- Current branch is `main` or `master` → stop, create a branch
- `git status` shows `.env` or secrets files modified → do not stage, warn the user
- `git status` shows `.claude/worktrees/` as untracked → exclude from staging
- Commit message body is missing → add it; the why matters for future debugging
