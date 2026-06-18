# Continuous Resume — Design (MVP Slice 1)

- **Date:** 2026-06-17
- **Status:** Building. Direction approved by user ("lets build"). Proof posture deferred (see Open Fork).

## Vision

A resume that maintains itself. Users connect their work surfaces — GitHub first, then
Linear / Asana / Jira — and the system ingests *what they actually did*, synthesizes
resume content with evidence links, and renders it as a web page + downloadable PDF.
Goal: never hand-edit a resume again.

## MVP scope (slice 1): GitHub → resume

1. GitHub sign-in (OAuth).
2. Ingest GitHub activity: profile, repos (owned + contributed), languages, merged
   PRs/issues, contribution stats, orgs.
3. Normalize into `Activity` records — each carrying a `sourceUrl` (provenance).
4. Synthesize (LLM): structured resume — summary, skills, accomplishment bullets per
   notable project — each bullet linked to its evidence `Activity`. User can
   edit / accept / regenerate.
5. Render: resume web page (COSS UI) + downloadable PDF.

## Non-goals / deferred (named, not forgotten)

- Linear / Asana / Jira adapters — cheap adapters onto the same `Activity` model later.
- Continuous background sync — MVP is an on-demand "Sync now" + stored snapshots.
- The proof / verification *product* — MVP captures provenance only.

## Open fork: "proof"

Three interpretations: (a) provenance links, (b) cryptographic attestation / verifiable
credentials, (c) loose. **MVP architecture is proof-agnostic:** every claim carries a
`sourceUrl`, which keeps a/b/c open and is the prerequisite for the heavy (b) path. If (b)
is later chosen, add immutable evidence snapshots + signing to the data model.

## Data model

```
User 1—n Connection   (provider, accessToken, scopes)
User 1—n Activity      (provider, type, title, body, metrics, sourceUrl, occurredAt, raw)
User 1—1 Resume 1—n ResumeItem (kind, content, order)  n—n Activity (evidence)
```

Plus Better Auth tables (`user`, `session`, `account`, `verification`).
SQLite for local dev → Postgres for prod. Use `String`/text fields over enums, `Json`,
and scalar lists so the schema is portable across both providers (SQLite lacks all three).
JSON payloads (`metrics`, `raw`) stored as stringified text.

## Stack

- **App:** Next.js 16, React 19, Tailwind v4, COSS UI (already scaffolded).
- **Auth:** **Better Auth** — chosen over Auth.js v5 for clean Next 16 compatibility and
  built-in `account` access-token storage (we need the GitHub token for ingestion).
  GitHub social provider; scopes `read:user`, `user:email`, `read:org`, `repo`.
- **DB/ORM:** Prisma + SQLite (dev) / Postgres (prod).
- **GitHub API:** Octokit (GraphQL contributions + REST).
- **Synthesis:** Anthropic Claude (default) via API; provider-pluggable behind one interface.
- **PDF:** headless Chromium (Playwright) rendering the resume web route → web == PDF, one layout.

## Build order

1. Auth + GitHub OAuth + Prisma data layer.
2. Ingestion → `Activity` store.
3. Synthesis → `Resume`.
4. Resume web render.
5. PDF export.

## External prerequisites (user-provided secrets)

Code is implemented in full; these secrets are required only to exercise the flow live:

- **GitHub OAuth app** → `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `.env`
  (callback `http://localhost:3000/api/auth/callback/github`). Needed for login + API.
- **Anthropic API key** → `ANTHROPIC_API_KEY` in `.env`. Needed for synthesis (step 3).

## Verification plan

- Prisma schema validates; migration applies to SQLite; client generates.
- `npm run build` (typecheck) green.
- Ingestion mapping unit-tested against recorded GitHub fixture payloads (no network).
- Synthesis tested with the LLM client mocked at the boundary (no network).
- Resume render + PDF: build smoke + route test.
