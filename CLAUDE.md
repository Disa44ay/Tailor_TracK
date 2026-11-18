# Tailor_Track — project rules

Small varsity project. Stack: React/Vite, plain JS, Tailwind CSS (frontend) + Express + raw SQL via `pg`, no ORM (backend) + Postgres (DB). Deploy: Vercel (frontend) + Render (backend); Postgres hosted free on Neon or Supabase in production, a local Docker container in dev. Chosen over Next.js (extra server/client-component concepts not needed here) and over Java/Spring Boot (needs Maven/Gradle installed, and hides the SQL behind annotations instead of showing it — the opposite of "easy to explain" for a DBMS-course audience) and .NET (no SDK installed). Node and Docker are already installed; nothing else needs installing for local dev.

## Model roles (this project only)

- **Fable 5.5** — available for one day only, starting 2026-11-18. Its job in this project is planning and environment setup only: design the folder/repo layout, scaffold the Next.js + Express + Postgres structure, write the initial plan, and leave clear written instructions (in this file or a linked doc) for the models that build after it. Fable does not stay on as advisor past its one-day window.
- **Opus** — becomes the project's advisor as soon as Fable's day is over (i.e., once Fable is disabled/unavailable). Reviews plans and code; does not do the hands-on implementation.
- **Sonnet 5** — the worker agent for this project. Does the actual implementation (writing code, running commands, fixing bugs) on the plan Fable and Opus set up.

If a session can't tell which model it currently is, it should ask rather than guess the role.

## Git workflow (this is also a teaching goal — explain each step as it happens, don't just do it silently)

- `main` is the production branch. It must always stay clean and deployable — no work-in-progress commits land there directly.
- All work happens on a separate branch (e.g. `dev`, or a `feature/<name>` branch cut from `dev`). This is the "test tree."
- **Auto-merge rule (updated 2026-11-18, supersedes the old "ask every time" rule below it):** when executing an approved plan task-by-task, push each small batch of work (one task, or a few related ones) to `dev` as soon as it's done, and if its own tests actually pass (TDD green — not "looks right," an actual passing test run), merge that batch into `main` right away, without asking first. No confirmation needed per batch — this is a standing approval for working, tested code.
  - If something about a given batch feels uncertain — tests are flaky, the change is large/risky, the batch is mid-way through something bigger, or it's just not clearly safe to merge — **don't merge it, and don't ask either.** Just leave it on `dev`, say in one line that it's staying there and why, and keep going. Silence (not merging) is the safe default when unsure; asking is not.
  - This auto-merge rule is scoped to batches of an already-approved plan being executed. A standalone decision with real stakes (changing the approved design, picking a new dependency with real tradeoffs, anything destructive) still gets raised normally — this rule is only about *whether to merge already-tested code*, not a blanket "stop asking about everything."
- Still true regardless of auto-merge: prefer `git merge --no-ff` (or a PR merge) so the history shows each merge as a deliberate step, and if something on `main` turns out broken after merge, use `git revert <commit>` to undo it with a new commit rather than rewriting history.
- Never force-push, rebase, or reset `main`.

## Frontend quality

Use the **`design-taste-frontend`** skill for any UI/frontend work on this project. It's already available in this session at no cost and is built specifically to keep generated frontends from looking like generic AI output (templated layouts, default spacing/shadows/gradients, stock copy). Invoke it before writing or reviewing any page, component, or layout.
