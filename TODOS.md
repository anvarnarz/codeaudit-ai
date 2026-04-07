# TODOs — CodeAudit AI

## v0.7.0 — Distribution & Polish

- [ ] npm publish — `npm install -g codeaudit-ai` works globally
- [ ] Homebrew formula for macOS users
- [ ] Auto-update notification when new version available
- [ ] E2E test: run full audit on a sample repo in CI
- [ ] Better error messages when LLM API key is invalid/expired/rate-limited
- [ ] README with screenshots

## v0.8.0 — Multi-Repo Analysis

- [ ] Multi-folder selection for cross-repo audit
- [ ] Integration with `multi_repo_review_guide.md`
- [ ] Unified product health report across repos

## v1.0.0 — Public Release

- [ ] Model accuracy/quality metrics display
- [ ] Performance testing: large repos (100K+ LOC)
- [ ] Architecture & contributing documentation
- [ ] License decision
- [ ] All of v0.7 + v0.8 complete

## Known Issues

- [ ] Phase 9 checkbox in `.planning/milestones/v1.2-ROADMAP.md` still unchecked (cosmetic — work was completed)
- [ ] Live audit testing against Python/Go repos deferred to operational validation (structural validation passed)

## Completed

- [x] OpenAI-compatible provider support (v0.6.0)
- [x] Model discovery for custom endpoints (v0.6.0)
- [x] Base URL field in API key management UI (v0.6.0)
- [x] CLI packaging with tsup (v0.5.0)
- [x] GitHub Actions CI pipeline (v0.5.0)
- [x] Symlink escape fix (v0.5.0)
- [x] Accurate cost tracking (v0.5.0)
- [x] Dead code cleanup (v0.5.0)
- [x] Test suites for critical paths (v0.5.0)
