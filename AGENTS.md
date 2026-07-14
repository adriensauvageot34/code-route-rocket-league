# AGENTS.md

Codex agents working in this repository must follow this protocol for any task that is meant to reach GitHub or Vercel.

## Source of truth

- Official repository: `adriensauvageot34/code-route-rocket-league`.
- Default branch: `main`.
- Vercel Production is sourced from `main` only.
- Treat GitHub `main` as the only source of truth. Old local folders, recovery folders, and unsynchronized clones are not authoritative.

## Required start check

Before editing code for a GitHub/Vercel task, state the execution context: Cloud, Local, Worktree, or connector-only.

Then verify and report:

- Git root, if a local checkout exists.
- Current branch and current HEAD SHA.
- Current SHA of `main` on GitHub.
- Remote URL, when using local Git.
- Whether the checkout contains the latest expected files from `main`.

If the current folder has no `.git`, is stale, or cannot prove it is based on current GitHub `main`, do not use it as the delivery source.

## Preferred delivery path

For application changes, prefer this path:

1. Fresh Codex Cloud checkout from current GitHub `main`.
2. Create a branch such as `agent/...` or `codex/...`.
3. Modify the real application files, not a recovery README.
4. Run relevant checks.
5. Commit and push the branch.
6. Open a PR against `main`.
7. Verify the Vercel Preview when app behavior changed.
8. Merge only when appropriate.
9. Verify `main` after merge.
10. Verify Vercel Production only after the merge reaches `main`.

A PR that only points to local files, patches, or a recovery README does not count as delivering the application change.

## Local and Windows failure rules

Local mode is allowed only when the checkout is a valid, synchronized Git repository.

If any of these occur, stop the local path after one quick diagnostic and switch to Cloud or the GitHub connector:

- The folder has no `.git`.
- `git fetch`, `git pull`, or `git push` is blocked by proxy settings such as `HTTP_PROXY`, `HTTPS_PROXY`, or `ALL_PROXY` pointing to `127.0.0.1:9`.
- Git Credential Manager blocks, waits for interactive login, or has no usable token.
- Windows TLS or schannel prevents GitHub network access.
- Local build fails after compilation because of Windows `spawn EPERM` or sandbox process limits.
- The checkout is older than GitHub `main` or cannot prove its base SHA.

Do not spend time searching random folders under `Documents/Codex` for another copy of the project. Preserve any local work that matters, then restart from a clean GitHub source.

## Connector-only fallback

When local Git push is blocked but the GitHub connector can write:

- Create the branch from the current GitHub `main` SHA.
- Write the real changed files to that branch.
- Prefer a single tree/commit when practical; otherwise keep commits clear and scoped.
- Compare the branch with `main` before opening the PR.
- List the changed files and confirm no unrelated routes or content moved.
- Open a PR against `main`.

Do not claim success just because files exist locally. The branch and PR must exist on GitHub.

## Checks

Run the most relevant checks available for the changed area. For this project, use package scripts when present, for example tests, TypeScript, lint, content validation, and build.

If a local build is blocked by the Windows environment after compilation, say that clearly and rely on Vercel Preview for the cloud build result. Do not describe that as a clean local build.

## Reporting rules

Never say `merged` without a PR link and a merged state.

Never say `Vercel OK` without saying whether it is Preview or Production and providing the status or link used as proof.

Never say `main is updated` without checking the post-merge SHA on GitHub.

For every GitHub/Vercel delivery, report:

- Execution context used.
- Base `main` SHA.
- Branch name.
- Commit SHA or connector write result.
- PR URL and state.
- Checks run and their result.
- Vercel Preview or Production result, when relevant.

## Scope discipline

Keep changes limited to the requested feature or fix. Do not touch `/session`, question data, captures, HUD, content files, or unrelated UI unless the user specifically asks for that area.

If work must be recovered from local files, bring the actual files into a fresh branch. Do not ship a pointer to the local path as the implementation.
