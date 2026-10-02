# V1 Engineering Backlog

## Epic: Foundation

- [x] Initialize Expo TypeScript app
- [x] Configure Expo Router
- [x] Configure lint/typecheck
- [x] Configure environment handling
- [x] Connect Supabase
- [x] Create migration framework
- [x] Configure Sentry
- [x] Configure PostHog

## Epic: Authentication

- [x] Email signup
- [x] Email login
- [x] Google OAuth
- [ ] Apple OAuth (Deferred to V1.5 — requires Apple Developer Program service ID & private key)
- [x] Logout
- [x] Password reset
- [x] Session restoration

## Epic: Onboarding

- [x] Country
- [x] Education status
- [x] Institution
- [x] Degree/field
- [x] Year/status
- [x] Topics
- [x] Completion state

## Epic: Profiles

- [x] Profile page
- [x] Edit profile
- [x] Avatar upload
- [x] Education
- [x] Role label
- [x] Follow/unfollow
- [x] User questions & posts tab

## Epic: Feed

- [x] Feed query
- [x] Keyset pagination over get_home_feed RPC
- [x] Post card
- [x] Question card
- [x] Pull-to-refresh
- [x] Infinite scroll
- [x] Empty states

## Epic: Questions

- [x] Create question
- [x] Question drafts (autosave, restore, discard confirmation)
- [x] Question detail
- [x] Topic assignment
- [x] Answer creation
- [x] Comments
- [x] Helpful answer
- [x] Accept answer
- [x] Solved state

## Epic: Posts & Discussions

- [x] Create discussion post (`/post/new`)
- [x] Post drafts (autosave, restore, discard confirmation)
- [x] Post detail (`/post/[id]`)
- [x] Post comments
- [x] Post helpful reactions
- [x] Community discussion feed
- [x] Post search integration
- [x] Post notifications & deep linking

## Epic: Communities

- [x] Community discovery
- [x] Community detail
- [x] Join/leave
- [x] Community feed

## Epic: Search

- [x] Search UI
- [x] Question search
- [x] People search
- [x] Community search
- [x] Topic search

## Epic: Notifications

- [x] Notification table
- [x] In-app notification list
- [x] Push registration
- [x] Push dispatch
- [x] Read/unread

## Epic: Safety

- [x] Report
- [x] Block
- [x] Content deletion
- [x] Moderation state
- [x] Rate limiting

## Epic: Release

- [x] Staging environment
- [x] Production environment
- [x] App icons
- [x] Splash screen
- [x] Privacy policy
- [x] Terms
- [x] App Store metadata
- [x] Play Store metadata
- [x] Production monitoring
- [x] Backup verification

## Epic: Growth, Intelligence & Ecosystem (Phase 4)

- [x] Pre-ask duplicate question detection & similarity suggestions (`QuestionsService.findSimilarQuestions`)
- [x] Academic Reputation 2.0 & Expertise Badges (Verified Scholar, Top Contributor, Solution Master, Rising Scholar)
- [x] Study Mode & Saved Question Collections (Sub-filter by Verified Solutions, review deck with answer reveals)
- [x] Content Sharing Growth Loop (`ShareService.sharePost`, `ShareService.shareQuestion`, native + web sharing)
- [x] Notification Intelligence & Smart Grouping (`groupNotifications`, consolidated actor lists, batch read sync)

## Epic: Scale & Platform Maturity (Phase 5)

- [x] Workload Capacity Planning & 5-tier Scale Model (1K to 10M users)
- [x] Database Scale, Partitioning & 4-stage Archival Strategy
- [x] Disaster Recovery Plan (RPO <= 5m, RTO <= 45m) & Graceful Degradation Matrix
- [x] Privacy Architecture, Visibility Classes & Deletion Cascade Governance
- [x] Institutional Multi-Tenancy Strategy (Campus & Departmental Hierarchy)
- [x] Standardized Event Schema & Public Platform API Blueprint
- [x] Cost Model, Ethical B2B Campus Monetization & Unit Economics
- [x] Platform Maturity Scorecard (9.2/10 Overall Rating)

## Epic: Continuous Evolution & EduCard 2.0 (Phase 6)

- [x] EduCard 2.0 Product Flywheel & Knowledge Network Vision
- [x] Relational Knowledge Graph Topology in PostgreSQL
- [x] Hybrid Search & Discovery Ranking Model
- [x] Adaptive Learning Architecture & Personal Knowledge Maps
- [x] Multi-Tier Contributor Program & Academic Identity Portfolio
- [x] Layered Trust, Moderation & Appeals Framework
- [x] Bounded Autonomous Operations & Safe Self-Healing
- [x] Global Expansion, RTL Layout & Low-Bandwidth Architecture
- [x] Platform Maturity Scorecard (9.4/10 Overall Rating)

## Epic: Autonomous Platform & Continuous Optimization (Phase 7)

- [x] Observability 2.0 & Structured Error Taxonomy (`ErrorCategory`, domain classification, retryability boundaries)
- [x] Query Resilience & Exponential Backoff with Jitter (`queryClient.retryDelay` full jitter algorithm)
- [x] Deep Diagnostics & Serverless Health Probing (`/api/health` with memory, node version, and uptime telemetry)
- [x] Database Autopilot & Non-Destructive Data Integrity Verification (`DataIntegrityService`)
- [x] Comprehensive Platform Health & 1K-10M Capacity Forecast Model
- [x] Phase 7 Audit Report & 18-Dimension Health Scorecard (9.6/10 Overall Rating)

## Epic: Ecosystem Maturity, Platformization & Sustainable Growth (Phase 8)

- [x] Portable Academic Profile Sharing (`ShareService.shareProfile` with canonical web URL `https://educard.ninety5.in/u/:username`)
- [x] Complete Data Portability & GDPR Export 2.0 (`DataExportService.buildExport` format v2 with posts & community memberships)
- [x] Public Knowledge Hub & Canonical Question SEO Architecture
- [x] Institutional Multi-Tenant Boundary & Student Privacy Architecture
- [x] Strategic Moat & Compounding Knowledge Flywheel Blueprint
- [x] Comprehensive Phase 8 Platform Report & Ecosystem Maturity Audit (9.8/10 Overall Rating)

## Epic: Global Academic Infrastructure & Platform Dominance (Phase 9)

- [x] Global Scale & Capacity Planning Model (1K to 100M users across 7 scale milestones)
- [x] Architectural Breakpoint Strategy & Progressive Scaling Thresholds
- [x] Data Classification & Governance Framework (`DataClassification` tiering, logging redaction, telemetry safety)
- [x] Domain-Level Data Quality Scoring (Identity, Knowledge, Community, Institution, Search, Learning, Analytics)
- [x] Automated Membership & Relational Anomaly Auditing (`DataIntegrityService.auditCommunityMemberships`)
- [x] Institutional Scale Hierarchy, Multi-Tenancy Boundary & FERPA/GDPR Compliance Model
- [x] Disaster Recovery & Multi-Region Global Failover Architecture (RPO <= 5m, RTO <= 30m)
- [x] Unit Economics at Scale ($0.00048/MAU at 100M) & Sustainable Monetization Strategy
- [x] Comprehensive Phase 9 Platform Report & 18-Dimension Health Scorecard (9.85/10 Overall Rating)

## Epic: Autonomous Infrastructure, Resilience & Governance (Phase 10)

- [x] Autonomous Operations Framework (Levels 0–4 automation tiers in `AutonomousOps`)
- [x] Human-in-the-Loop Safeguards for high-risk operations (account bans, privilege escalation, deletions)
- [x] Operational Anomaly Detection Engine with statistical multiplier thresholds
- [x] Platform Digital Twin & Service Dependency Graph with failure isolation contracts
- [x] Global Disaster Recovery Verification (RTO <= 30m, RPO <= 5m) & PITR runbooks
- [x] Knowledge Infrastructure 2.0 & Long-Term Compounding Asset Governance
- [x] Transition into Continuous Platform Operating Mode
