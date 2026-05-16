# Hyperframes

Open-source video rendering framework: write HTML, render video.

## Skills

This repo ships AI agent skills via [vercel-labs/skills](https://github.com/vercel-labs/skills). Install them before writing compositions — they encode framework-specific patterns that generic docs don't cover.

```bash
npx skills add heygen-com/hyperframes
```

## Build & Test

```bash
bun install     # Install dependencies (NOT pnpm — do not create pnpm-lock.yaml)
bun run build   # Build all packages
bun run test    # Run all tests
```

### Linting & Formatting

Uses **oxlint** and **oxfmt** (not eslint, not prettier, not biome).

```bash
bunx oxlint <files>        # Lint
bunx oxfmt <files>         # Format
bunx oxfmt --check <files> # Check formatting (CI / pre-commit)
```

Always lint and format changed files before committing. Lefthook pre-commit hooks enforce this automatically.

### Composition Validation

After creating or editing any `.html` composition:

```bash
npx hyperframes lint       # Static HTML structure check
npx hyperframes validate   # Runtime check (headless Chrome — catches JS errors, missing assets)
```

Both must pass before previewing or considering work complete.

## Project Structure

```
packages/
  cli/                  → hyperframes CLI (create, preview, lint, render)
  core/                 → Types, parsers, generators, linter, runtime, frame adapters
  engine/               → Seekable page-to-video capture engine (Puppeteer + FFmpeg)
  player/               → Embeddable <hyperframes-player> web component
  producer/             → Full rendering pipeline (capture + encode + audio mix)
  shader-transitions/   → WebGL shader transitions for compositions
  studio/               → Browser-based composition editor UI
registry/
  blocks/               → Installable sub-composition scenes (50+)
  components/           → Installable effects and snippets
  examples/             → Starter project templates
docs/                   → Mintlify documentation site (hyperframes.heygen.com)
skills/                 → AI agent skill definitions
```

## Key Conventions

- **Package manager**: bun (not pnpm, not npm for workspace operations)
- **Commit format**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **TypeScript**: Avoid `any` and `as T` assertions. Prefer type guards and narrowing.
- **Compositions**: HTML files with `data-*` attributes. Clips need `class="clip"`. GSAP timelines must be paused and registered on `window.__timelines`.
- **Frame Adapters**: Animation runtimes plug in via the seek-by-frame adapter pattern. GSAP is the primary adapter.
- **Deterministic rendering**: No `Date.now()`, no unseeded `Math.random()`, no render-time network fetches.

## Agent Workflow

- For long-running or parallelizable work, prefer using a worker/subagent in the background.
- Keep the main agent responsive for user questions and coordination instead of blocking on renders, validation, large scans, builds, tests, or broad refactors.
- Good subagent tasks include:
  - `npx hyperframes lint`, `validate`, `inspect`, and `render`
  - large asset or source scans
  - video composition implementation or repair
  - platform-spec research and summary
  - long-running build and test verification
- The main agent owns coordination, user-facing answers, result integration, and final engineering judgment.

## Branch Inheritance

- Shared rules, skills, and framework changes live on `main`.
- Personal video branches use `video/<name>` locally and should not be pushed to remote.
- Before continuing work in an existing `video/*` branch, merge or rebase the latest `main` so new skills and AGENTS.md rules are inherited.
- When adding a new shared skill or agent rule, add it on `main` first, then update active local video worktrees from `main`.

## Documentation

- Docs: https://hyperframes.heygen.com/introduction
- Catalog (50+ blocks): https://hyperframes.heygen.com/catalog/blocks/data-chart
