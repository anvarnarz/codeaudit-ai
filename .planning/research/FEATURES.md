# Feature Research

**Domain:** Codebase audit / static analysis webapp (LLM-powered, BYOK model)
**Researched:** 2026-03-21
**Confidence:** HIGH (competitor features), MEDIUM (BYOK+LLM-specific patterns)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume any code analysis platform has. Missing these makes the product feel unfinished or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| GitHub OAuth integration | Every competitor connects via OAuth; PAT-only feels like a workaround | MEDIUM | Standard OAuth 2.0 flow; needs private repo scope |
| Repository browser / selector | After auth, users expect to browse and pick a repo — not paste a URL | LOW | List repos from GitHub API, filter by org/personal |
| Scan / audit progress indicator | Long-running analysis requires visible progress; silence = user abandons | MEDIUM | Phase-by-phase status; poll or websocket |
| In-app results dashboard | Findings rendered in-app; competitors all do this — download-only feels dated | HIGH | Scores, charts, findings list, severity breakdown |
| Downloadable reports | Users share reports with managers or attach to tickets; PDF/HTML export is standard | MEDIUM | Generate HTML dashboards + markdown; zip download |
| User authentication | Sign-up/sign-in with session management | LOW | Standard; can layer on GitHub SSO |
| Audit history list | Users expect to see past audits; disappearing history erodes trust | MEDIUM | Store metadata + results; paginated list view |
| Security findings section | Every major tool (SonarQube, DeepSource, Snyk, Codacy) includes SAST-style security findings | HIGH | Maps to Phase 6 (security) of the 13-phase process |
| Code quality metrics | Complexity, duplication, maintainability — the baseline expectation across all tools | MEDIUM | Maps to phases covering complexity, tests, dependencies |
| Multi-language detection | Users have mixed-language repos and expect auto-detection | LOW | Phase 0 bootstrap handles this; surface it clearly |
| Findings severity classification | Critical / High / Medium / Low rating for findings — universal across all competitors | LOW | Apply during report generation; drive visual hierarchy |

### Differentiators (Competitive Advantage)

Features that set this product apart. The core differentiator is LLM-powered holistic narrative analysis vs rule-based static analysis — lean into that.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| BYOK (Bring Your Own LLM Key) | Users control costs and provider choice; no platform AI markup; differentiates from every major competitor that either charges per-scan or has opaque pricing | LOW | Securely store encrypted keys; support Anthropic/OpenAI/Gemini; show cost per audit |
| Multi-LLM provider support | Teams with OpenAI enterprise agreements or Gemini credits can use their existing subscriptions | MEDIUM | Prompt compatibility across providers is the real engineering challenge |
| Holistic narrative findings | Unlike rule-based tools (SonarQube, Codacy), LLM produces natural language explanations with architectural context — not just line-number alerts | HIGH | Core audit engine; quality depends on prompt engineering of the 13-phase process |
| Audit depth selection (quick scan vs deep audit) | No competitor exposes this tradeoff explicitly; users with small time windows need the quick option | MEDIUM | Quick scan = subset of phases + sampling; needs design work |
| Audit type selection (security-only, team, code quality, full) | Targeted audits reduce noise; competitors run one mode only | MEDIUM | Maps to existing audit run modes in the guide |
| Phase-by-phase live progress with expandable detail | Most tools show a spinner; phase-granular visibility with collapsible detail makes the process transparent and builds trust | MEDIUM | Default = simplified; expandable = raw phase output |
| Real-time token usage and cost display | No competitor shows AI cost per audit; BYOK users will want this before and during runs | MEDIUM | Track tokens per LLM call; multiply by provider pricing; display in-app |
| Audit comparison (delta report) | When re-running an audit on the same repo, show what improved or degraded since last time — no competitor does this for holistic narrative audits | HIGH | Phase 12 in the guide; requires storing structured previous results |
| Git archaeology insights | CodeScene does behavioral analysis (hotspots, bus factor) but it's their paid tier; surfacing ownership concentration and knowledge silos from git history is distinctive | HIGH | Maps to Phase 5 (git archaeology) of the 13-phase process |
| Executive vs technical report split | Management dashboard + technical dashboard as separate views; CodeScene does something similar but not as a deliverable you download | MEDIUM | Phase 11 already produces both HTML dashboards |
| Pre-audit cost estimate | Tell users "this audit will cost ~$X at your current provider" before they start; rare in any tool | MEDIUM | Estimate tokens by repo size + depth selection |
| Sandboxed read-only clone execution | The safety model is a concrete guarantee: no writes, no push, no network calls to production; makes it auditable for security-conscious teams | HIGH | Replicate the filesystem lock + push block programmatically in backend |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but create real problems for this product at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automated fix / PR generation | Every AI tool is adding this; users will ask for it | Requires write access to repos — destroys the read-only safety model that is the product's security guarantee. Also dramatically expands scope and failure modes | Keep the product read-only; provide copy-paste-ready fix snippets in findings instead |
| Real-time collaborative auditing | Teams want to annotate findings together | Multiplies infrastructure complexity (websockets, presence, conflict resolution) before core value is validated | Share read-only report links after audit completes |
| IDE plugin / extension | DeepSource, SonarQube, Codacy all have IDE integrations | Forces managing separate release channels (VS Code Marketplace, JetBrains Marketplace) with different auth models; high maintenance burden for a greenfield product | Direct users to the webapp; IDE integration is v2+ when usage patterns are known |
| Continuous monitoring (webhook-triggered scans on every push) | DeepSource and Codacy do this; users will expect it eventually | Makes sense for rule-based static analysis that runs in seconds; an LLM deep audit takes 30 min to hours and costs real money — automatic triggers create runaway costs on BYOK | Support manual re-runs and scheduled audits; surface "re-run available" prompts when repo has new commits since last audit |
| Self-hosted / on-premise deployment | Enterprise teams with air-gap requirements | Dramatically increases ops burden; containerization, licensing, update distribution; wrong focus for v1 | Cloud-only v1; flag self-hosted as v2+ enterprise tier |
| GitLab / Bitbucket support | Users with non-GitHub repos will request it | Adds separate OAuth providers, API clients, clone logic — multiplies surface area before GitHub is proven | GitHub-only v1; design clone/auth layer to be provider-agnostic for v2 |
| Public leaderboard / benchmarking | Sounds like marketing; comparison across repos | Creates incentive to game metrics; damages trust if proprietary code is inadvertently exposed; legal risk | Anonymous aggregate stats are fine; no per-repo public exposure |

---

## Feature Dependencies

```
GitHub OAuth
    └──requires──> Repository Browser
                       └──requires──> Audit Configuration (type, depth)
                                          └──requires──> LLM API Key Management
                                                             └──requires──> Audit Engine (13-phase)
                                                                                └──requires──> Phase Progress Tracking
                                                                                                   └──enables──> In-App Results Dashboard
                                                                                                   └──enables──> Downloadable Reports
                                                                                                   └──stores──> Audit History

Audit History
    └──enables──> Audit Comparison (delta report)

LLM API Key Management
    └──enables──> Pre-Audit Cost Estimate
    └──enables──> Real-Time Token Usage Display

Audit Engine (phase 0 bootstrap)
    └──requires──> Sandboxed Read-Only Clone
    └──enables──> Multi-Language Detection

Security Findings Section
    └──requires──> Audit Engine (phase 6 security)

Git Archaeology Insights
    └──requires──> Audit Engine (phase 5 git archaeology)

Audit Comparison
    └──requires──> Audit History
    └──requires──> Structured Result Storage (not just HTML blobs)
```

### Dependency Notes

- **Audit Comparison requires Structured Result Storage:** If audits are stored only as HTML/markdown files, comparison is not possible. Phase-specific structured data (JSON with scores per finding category) must be stored alongside the rendered reports. This is a schema decision that must be made in Phase 1 or it becomes a migration problem later.
- **Cost Estimate requires token counting before execution:** Needs a repo-size heuristic (file count, LOC) plus provider pricing table; this is approximate, not exact — set expectations accordingly.
- **Continuous monitoring conflicts with BYOK cost model:** Auto-triggering expensive LLM audits on every push burns user API keys. This is not a technical problem — it is a product model problem. Do not build webhook triggers in v1.
- **Read-Only Clone enables all security guarantees:** Every downstream feature depends on this being enforced at the infrastructure layer. If it breaks, the product's trust story breaks.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what is needed to validate that users will pay for LLM-powered holistic audits delivered via a webapp.

- [ ] GitHub OAuth + repository browser — without this, access to private repos is blocked
- [ ] LLM API key management (Anthropic, OpenAI, Gemini) — without BYOK, the platform bears unbudgeted AI costs
- [ ] Audit type selection (full, security-only, team, code quality) — validates different use cases with minimal extra work
- [ ] Audit depth selection (quick scan vs deep audit) — users need the quick option to experience the product without a 4-hour wait
- [ ] Sandboxed read-only clone execution — non-negotiable safety; cannot launch without it
- [ ] Audit engine (all 13 phases, multi-LLM) — this is the core product; everything else is wrapper
- [ ] Phase-by-phase progress tracking (simplified + expandable) — required for long-running jobs; users need to see it working
- [ ] In-app results dashboard with findings, scores, and severity breakdown — minimum for the output to feel like a product
- [ ] Downloadable reports (HTML + markdown) — enables sharing; critical for manager-facing use case
- [ ] User authentication — required to store keys and history
- [ ] Audit history list — users need to see their previous audits; a product that forgets is not trusted
- [ ] Real-time token usage display during and after audit — users must see what they are spending
- [ ] Pre-audit cost estimate — set expectations before users commit to a run

### Add After Validation (v1.x)

Features to add once core audit flow is working and users have provided feedback.

- [ ] Audit comparison (delta report) — add when users have run at least 2 audits and ask "did we improve?"; requires structured result storage from day one even if the UI ships later
- [ ] Scheduled / reminder re-runs — add when users express desire for cadence ("remind me to re-audit monthly")
- [ ] Shareable read-only report links — add when teams want to share with non-users (managers, external reviewers)
- [ ] Git archaeology deep-dive UI — data exists in audit; richer visualization can be layered on post-launch

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multi-repo / cross-product analysis — scope is defined in the guide but adds significant complexity; single-repo must be proven first
- [ ] GitLab and Bitbucket support — design the GitHub layer to be provider-agnostic, then add in v2
- [ ] Self-hosted deployment — enterprise tier; requires ops investment that is premature in v1
- [ ] IDE plugin / extension — add only if users are actively running audits and want results in-context while coding
- [ ] Automated fix / PR suggestion generation — if ever built, must be a separate mode with explicit write-access grant and a different safety model

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| GitHub OAuth + repo browser | HIGH | MEDIUM | P1 |
| LLM API key management (BYOK) | HIGH | LOW | P1 |
| Sandboxed read-only clone | HIGH | HIGH | P1 |
| Audit engine (13 phases) | HIGH | HIGH | P1 |
| Phase progress tracking | HIGH | MEDIUM | P1 |
| In-app results dashboard | HIGH | HIGH | P1 |
| User authentication | HIGH | LOW | P1 |
| Audit type + depth selection | HIGH | MEDIUM | P1 |
| Real-time token usage + pre-audit cost estimate | HIGH | MEDIUM | P1 |
| Downloadable reports | HIGH | MEDIUM | P1 |
| Audit history | MEDIUM | MEDIUM | P1 |
| Multi-LLM provider support | MEDIUM | MEDIUM | P1 |
| Severity classification in findings | MEDIUM | LOW | P1 |
| Audit comparison (delta) | HIGH | HIGH | P2 |
| Shareable report links | MEDIUM | LOW | P2 |
| Scheduled re-run reminders | LOW | LOW | P2 |
| Git archaeology visualization | MEDIUM | HIGH | P3 |
| Multi-repo analysis | MEDIUM | HIGH | P3 |
| Self-hosted deployment | LOW | HIGH | P3 |
| IDE extension | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | SonarQube / Codacy / DeepSource | CodeScene | This Product |
|---------|----------------------------------|-----------|--------------|
| Analysis mechanism | Rule-based static analysis; deterministic | Behavioral (git history) + static | LLM-powered holistic analysis; narrative findings |
| GitHub integration | OAuth, webhook, PR comments | OAuth, PR automation | OAuth, manual run trigger (no auto-trigger in v1) |
| Findings format | Line-level issue list with rule ID | Hotspot maps, team dynamics charts | Structured findings with natural-language explanation + severity |
| Reports | Dashboard in-app; no narrative | Visualization dashboards | Narrative report + two HTML dashboards (executive + technical) |
| Audit history | Continuous scan history | Trend charts over commits | Per-run audit snapshots with comparison |
| Audit types | One mode (continuous scan) | One mode | Full / security-only / team / code quality / custom |
| Cost model | Per-seat or per-repo subscription | Per-seat subscription | BYOK — user pays provider directly, platform charges for service |
| AI features | Autofix suggestions (DeepSource), refactoring hints (CodeScene) | ACE refactoring assistant | Core analysis is AI; findings are narrative explanations |
| Security analysis | SAST, OWASP, SANS (DeepSource, Codacy, SonarQube) | Limited | Full security phase (Phase 6); maps to OWASP categories |
| Team / knowledge insights | Limited (CodeScene excels here) | Bus factor, knowledge maps, coordination needs | Git archaeology phase: ownership concentration, churn hotspots |
| Cost transparency | Opaque (subscription hides per-scan cost) | Opaque | Explicit: token count + cost shown per audit |
| Depth control | None (all scans same depth) | None | Quick scan vs deep audit; user chooses tradeoff |
| Download artifacts | PDF export (SonarQube Enterprise) | No | HTML dashboards + markdown; zip download |

---

## Sources

- [DeepSource vs Code Climate comparison (DEV Community, 2026)](https://dev.to/rahulxsingh/deepsource-vs-code-climate-automated-code-quality-platforms-compared-2026-3l85)
- [10 Best Code Climate Alternatives (DEV Community, 2026)](https://dev.to/rahulxsingh/10-best-code-climate-alternatives-for-code-quality-in-2026-259d)
- [Codacy vs SonarQube comparison (2026)](https://dev.to/rahulxsingh/codacy-vs-sonarqube-code-quality-platforms-compared-2026-35d2)
- [CodeScene product page](https://codescene.com/product)
- [CodeScene behavioral code analysis](https://codescene.com/product/behavioral-code-analysis)
- [DeepSource Code Climate alternatives page](https://deepsource.com/codeclimate-alternatives)
- [Codacy: 5 Best SonarQube Alternatives](https://blog.codacy.com/sonarqube-alternatives)
- [Snyk compliance reports documentation](https://docs.snyk.io/manage-risk/analytics/reports-tab/compliance-reports)
- [SourceForge: Codacy vs Code Climate vs DeepSource vs SonarQube Cloud](https://sourceforge.net/software/compare/Codacy-vs-Code-Climate-vs-DeepSource-vs-SonarQube-Cloud/)
- [RepoAudit: LLM-Agent for Repository-Level Code Auditing (arXiv 2025)](https://arxiv.org/abs/2501.18160)

---

*Feature research for: Codebase audit / LLM-powered holistic analysis webapp (CodeAudit Web)*
*Researched: 2026-03-21*
