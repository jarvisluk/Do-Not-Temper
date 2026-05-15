# AGENTS.md

Conventions for AI coding agents (Cursor, Codex, Claude Code, Aider, …)
working in this repository. Humans are welcome to follow them too.

This file is the source of truth — if a rule here conflicts with anything
the agent's tooling defaults to, **this file wins**.

## Golden rule: never commit on `main`

`main` is the protected default branch. **Do not** run `git commit` while
HEAD is on `main` under any circumstance — not even for "trivial" doc
fixes, not even when the working tree is clean and the change looks safe,
not even when you think you'll squash-merge it later.

A pre-commit hook (`.husky/pre-commit`) enforces this and will abort the
commit with a hint. **Do not bypass it with `--no-verify`** unless the
human user has explicitly asked you to.

### Correct flow for any change

1. **Check first**: `git branch --show-current`. If it prints `main`,
   stop and create a feature branch before staging anything.
2. **Branch off**: `git checkout -b <type>/<short-slug>` from `main`,
   where `<type>` is one of:
   - `feat/…`     — new user-facing capability
   - `fix/…`      — bug fix
   - `refactor/…` — internal cleanup, no behavior change
   - `docs/…`     — documentation only
   - `chore/…`    — tooling, deps, CI, build config
   - `perf/…`     — performance work
   - `test/…`     — tests only

   Examples that match the existing history:
   `refactor/split-modules`, `fix/pdf-vector-export`, `docs/align-design-md`.

3. **Commit** on the feature branch using
   [Conventional Commits](https://www.conventionalcommits.org/):
   `type(scope): subject`. Match the scope vocabulary already in
   `git log` (e.g. `export`, `design`, `structure`).
4. **Stop after committing**. Do *not* `git push` and do *not* open a PR
   unless the user has explicitly asked. Tell the user the branch name
   and let them decide whether to push / open a PR / squash / amend.

### What to do if you've already committed on `main` by mistake

Do not try to hide it. Tell the user immediately and offer to fix:

```bash
# Move the rogue commit(s) to a new branch, then reset main back to origin.
git branch <type>/<short-slug>
git reset --hard origin/main
git checkout <type>/<short-slug>
```

This is non-destructive as long as nothing has been pushed.

## Commit message style

Read the latest ~10 entries of `git log --oneline` before writing one.
Mirror the existing tone: short imperative subject, optional body for the
"why", no AI tool attribution / co-author lines.

The pre-commit hook runs `lint-staged`. Don't disable it.

## Things to never do without explicit user consent

- `git push` (any branch, any remote).
- `git push --force` / `--force-with-lease`.
- `git rebase -i`, `git rebase main`, `git merge`.
- `git commit --amend` on a commit that is already pushed.
- `gh pr create`, `gh pr merge`, `gh pr review`.
- Editing git config (`git config …`).
- Modifying `.husky/*`, `.github/workflows/*`, branch-protection rules,
  CI secrets, or anything else that weakens the safety net.

## Project specifics

- Package manager: **npm** (`package-lock.json` is the lockfile).
- Type checking: `npm run lint:types` (a no-emit `tsc`).
- Full lint: `npm run lint` (types + stylelint + unused-CSS check).
- Build: `npm run build`.
- Dev server: `npm run dev` (Vite, http://localhost:5173).
- Source layout under `src/`: `app/`, `sticker/`, `export/`, `utils/`,
  `assets/`, `fonts.ts`. The split is documented in `DESIGN.md` —
  consult it before reorganizing modules.
- PDF blend-mode handling is delegated to the
  [`jspdf-blend-modes`](https://www.npmjs.com/package/jspdf-blend-modes)
  package. Do not reintroduce hand-rolled `pdf.internal` writes.
