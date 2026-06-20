# The Resume Thing

Turn the work you actually do into an evidence-backed résumé — and keep it current automatically.

The Resume Thing is an open-source developer workspace that connects to the places you work (GitHub, Linear), continuously ingests your real contributions, and uses an LLM to draft résumé bullets **where every claim links back to its source**. You review the suggestions, and your résumé renders as a real typeset PDF you can edit in an Overleaf-style LaTeX editor.

> Status: early and evolving. Built in the open.

## Why

Solo and open-source developers have no manager, no performance review, and no employer brand vouching for them — and their work is scattered across tools. The hard part isn't writing a résumé, it's **legibility**: proving what you've done. This turns the exhaust of your real work into verifiable, sourced claims.

## Features

- **Multi-source ingestion** — GitHub (repos, PRs, issues, commits) and Linear (issues, projects), normalized into one provider-agnostic activity graph.
- **Evidence-backed synthesis** — an LLM drafts accomplishments from your activity; every bullet carries the PR/issue/commit it came from. The model is forbidden from inventing facts.
- **Continuous sync** — a background worker pulls new work on an interval and *additively* drafts new suggestions, never clobbering your accepted edits.
- **Review workflow** — triage AI suggestions (apply / edit / regenerate / dismiss) as a queue, keyboard-driven.
- **Real typesetting** — résumé renders to PDF via [Tectonic](https://tectonic-typesetting.github.io/); edit the LaTeX directly in a built-in CodeMirror editor with AI chat and live preview.
- **Light & dark**, throughout.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19, TypeScript
- [Prisma](https://www.prisma.io) 7 on SQLite (via `better-sqlite3`)
- [Better Auth](https://www.better-auth.com) (GitHub OAuth + Linear via generic OAuth)
- [Vercel AI SDK](https://sdk.vercel.ai) (Google Gemini by default; OpenAI supported)
- [Tectonic](https://tectonic-typesetting.github.io/) for LaTeX → PDF
- Tailwind CSS v4

## Getting started

### Prerequisites

- **Node 22** (required for the `better-sqlite3` native module)
- **Tectonic** — `brew install tectonic` (macOS) or see the [install guide](https://tectonic-typesetting.github.io/en/latest/installation.html)
- A package manager — this repo uses **Yarn**

### Setup

```bash
git clone https://github.com/NishantEC/the-resume-thing.git
cd the-resume-thing
yarn install
cp .env.example .env   # then fill in the values below
yarn prisma migrate dev
yarn dev
```

Open http://localhost:3019.

### Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — defaults to local SQLite (`file:./dev.db`)
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` — auth (generate the secret with `openssl rand -base64 32`)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — a [GitHub OAuth app](https://github.com/settings/developers)
- `GOOGLE_GENERATIVE_AI_API_KEY` (or set `LLM_PROVIDER=openai` + `OPENAI_API_KEY`)
- **Optional — Linear:** `LINEAR_CLIENT_ID` / `LINEAR_CLIENT_SECRET` from a [Linear OAuth app](https://linear.app/settings/api/applications/new) with redirect URI `http://localhost:3019/api/auth/oauth2/callback/linear`
- **Optional — continuous worker:** `CRON_SECRET`, and `WORKER_ENABLED=true` to run the in-process sync worker during `yarn dev` (tune `WORKER_INTERVAL_MS`). In production, schedule a request to `GET /api/cron/sync` with `Authorization: Bearer $CRON_SECRET`.

### Scripts

```bash
yarn dev      # dev server on :3019
yarn build    # production build
yarn test     # unit tests (vitest)
```

## License

[MIT](./LICENSE)
