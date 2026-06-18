import { describe, expect, it } from "vitest";
import {
  normalizeIssueOrPr,
  normalizeOrg,
  normalizeRepo,
  type IssueInput,
  type RepoInput,
} from "./normalize";

const repo: RepoInput = {
  id: 42,
  full_name: "acme/widgets",
  html_url: "https://github.com/acme/widgets",
  description: "Widget factory",
  language: "TypeScript",
  stargazers_count: 12,
  forks_count: 3,
  pushed_at: "2026-01-15T10:00:00Z",
  updated_at: "2025-12-01T10:00:00Z",
  fork: false,
  owner: { login: "acme" },
};

describe("normalizeRepo", () => {
  it("captures provenance url and a stable dedupe id", () => {
    const a = normalizeRepo(repo);
    expect(a.externalId).toBe("repo:42");
    expect(a.url).toBe("https://github.com/acme/widgets");
    expect(a.type).toBe("repo");
  });

  it("prefers pushed_at (work recency) over updated_at", () => {
    expect(normalizeRepo(repo).occurredAt?.toISOString()).toBe(
      "2026-01-15T10:00:00.000Z",
    );
  });

  it("falls back to updated_at when never pushed", () => {
    const a = normalizeRepo({ ...repo, pushed_at: null });
    expect(a.occurredAt?.toISOString()).toBe("2025-12-01T10:00:00.000Z");
  });

  it("encodes metrics as parseable JSON", () => {
    const m = JSON.parse(normalizeRepo(repo).metrics!);
    expect(m).toMatchObject({ language: "TypeScript", stars: 12, forks: 3, fork: false });
  });
});

describe("normalizeIssueOrPr", () => {
  const pr: IssueInput = {
    id: 7,
    title: "Add retry logic",
    html_url: "https://github.com/acme/widgets/pull/7",
    body: "Implements backoff",
    state: "closed",
    comments: 4,
    created_at: "2026-02-01T00:00:00Z",
    closed_at: "2026-02-03T00:00:00Z",
    repository_url: "https://api.github.com/repos/acme/widgets",
  };

  it("namespaces externalId by type so a PR and issue with same id never collide", () => {
    expect(normalizeIssueOrPr(pr, "pull_request").externalId).toBe("pull_request:7");
    expect(normalizeIssueOrPr({ ...pr }, "issue").externalId).toBe("issue:7");
  });

  it("uses closed_at as the accomplishment date", () => {
    expect(normalizeIssueOrPr(pr, "pull_request").occurredAt?.toISOString()).toBe(
      "2026-02-03T00:00:00.000Z",
    );
  });

  it("falls back to created_at while still open", () => {
    const a = normalizeIssueOrPr({ ...pr, state: "open", closed_at: null }, "pull_request");
    expect(a.occurredAt?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("derives the repo slug from the api url into metrics", () => {
    const m = JSON.parse(normalizeIssueOrPr(pr, "pull_request").metrics!);
    expect(m.repo).toBe("acme/widgets");
  });

  it("tolerates a missing repository_url", () => {
    const m = JSON.parse(
      normalizeIssueOrPr({ ...pr, repository_url: undefined }, "issue").metrics!,
    );
    expect(m.repo).toBeNull();
  });
});

describe("normalizeOrg", () => {
  it("builds a provenance url from the login", () => {
    const a = normalizeOrg({ id: 9, login: "acme", description: null });
    expect(a.externalId).toBe("org:9");
    expect(a.url).toBe("https://github.com/acme");
    expect(a.occurredAt).toBeNull();
  });
});
