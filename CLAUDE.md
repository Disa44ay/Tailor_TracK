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
- "Production ready" means **the user has explicitly approved it** — not that tests pass, not that it looks done. Code only moves to `main` after the user says so in words (e.g. "merge this," "ship it," "this is good").
- Workflow per change:
  1. Branch off `dev` (or off `main` if no `dev` exists yet) for the change.
  2. Build and test on that branch.
  3. Show the user the result (preview URL, local run, or diff).
  4. Only on explicit user approval, merge into `main` (prefer `git merge --no-ff` or a PR merge so the history shows it was a deliberate, reviewed step).
  5. If something on `main` turns out broken after merge, use `git revert <commit>` to undo it with a new commit rather than rewriting history.
- Never force-push, rebase, or reset `main`. Never skip the approval step because a task "looks small."

## Frontend quality

Use the **`design-taste-frontend`** skill for any UI/frontend work on this project. It's already available in this session at no cost and is built specifically to keep generated frontends from looking like generic AI output (templated layouts, default spacing/shadows/gradients, stock copy). Invoke it before writing or reviewing any page, component, or layout.
