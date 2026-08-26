# EduCard Database Architecture & Design Specification

## Overview
The EduCard database is built on **PostgreSQL 15+** managed via Supabase. It implements a hardened relational model designed for high concurrency, sub-10ms feed queries via keyset pagination, trigram & FTS search, granular Row-Level Security (RLS), and automated counter synchronization.

---

## 1. Schema Design Principles

1. **Native UUID Primary Keys**: All primary entities use `gen_random_uuid()` for low-overhead, random UUID generation without external C-extension calls.
2. **Composite Natural Keys**: Join tables (`community_members`, `user_topics`, `question_topics`, `follows`, `blocks`) use natural composite primary keys, eliminating surrogate key overhead and redundant unique indexes.
3. **UTC Timestamps**: All timestamps use `TIMESTAMPTZ` with `DEFAULT TIMEZONE('utc', NOW())`.
4. **Soft Deletions**: User-generated content (`questions`, `answers`, `posts`, `comments`) uses `deleted_at TIMESTAMPTZ` to preserve thread continuity and audit trails.
5. **GDPR & Privacy Compliance**: User deletion cascades to private data (`bookmarks`, `notifications`, `push_tokens`, `verification_requests`) and sets `author_id = NULL` on public discussions to prevent orphaned broken threads.
6. **Strict Domain Types**: 10 PostgreSQL `ENUM` types prevent invalid states at the database engine level.

---

## 2. Table Catalog (21 Entities)

| Table | Primary Key | Description | Key Constraints / Relationships |
|---|---|---|---|
| `profiles` | `id UUID` (FK `auth.users`) | Academic user profile & reputation | `username CITEXT UNIQUE`, `system_role`, `is_verified` |
| `universities` | `id UUID` | Higher education institutions | `domain CITEXT`, `verified BOOLEAN` |
| `education` | `id UUID` | Academic credentials & affiliation | FK `profiles`, FK `universities` |
| `topics` | `id UUID` | Subject matter disciplines | `slug CITEXT UNIQUE`, `name TEXT` |
| `user_topics` | `(user_id, topic_id)` | User-followed academic topics | Natural Composite PK |
| `communities` | `id UUID` | Peer learning groups | `slug CITEXT UNIQUE`, `member_count INT` |
| `community_members` | `(community_id, user_id)`| Community membership & roles | Role: `member`, `moderator`, `admin` |
| `posts` | `id UUID` | Scholarly discussions & updates | `visibility`, `helpful_count`, `comment_count` |
| `questions` | `id UUID` | Structured academic questions | `status`, `fts` (tsvector), `accepted_answer_id` |
| `question_topics` | `(question_id, topic_id)`| Question categorization bridge | Natural Composite PK, FK `topics` ON RESTRICT |
| `answers` | `id UUID` | Question responses | `is_accepted`, `helpful_count`, FK `questions` |
| `comments` | `id UUID` | Polymorphic threaded comments | Mutually exclusive target FK constraint |
| `reactions` | `id UUID` | Helpful votes and likes | Unique NULLS NOT DISTINCT per user/target |
| `follows` | `(follower_id, following_id)`| Academic peer following | Self-follow prevention constraint |
| `bookmarks` | `id UUID` | Saved questions & posts | Unique NULLS NOT DISTINCT per user/target |
| `push_tokens` | `id UUID` | Expo push notification tokens | `UNIQUE(user_id, expo_push_token)` |
| `notifications` | `id UUID` | System & social notifications | Recipient index with unread partial filter |
| `blocks` | `(blocker_id, blocked_id)` | Two-way interaction blocking | Self-block prevention constraint |
| `reports` | `id UUID` | Trust & safety reporting | Mutually exclusive target FK constraint |
| `verification_requests` | `id UUID` | Academic badge verification | `evidence_path`, `institutional_email` |
| `moderation_audit_logs`| `id UUID` | Immutable moderation actions | Admin/Mod only RLS |

---

## 3. High-Performance Indexing Strategy

### Keyset Feed Pagination
Deterministic composite index supporting `(created_at, id) < (cursor_created_at, cursor_id)`:
```sql
CREATE INDEX idx_questions_feed_pagination ON public.questions (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_unsolved_feed ON public.questions (created_at DESC, id DESC) WHERE deleted_at IS NULL AND status = 'open';
CREATE INDEX idx_posts_feed_pagination ON public.posts (created_at DESC, id DESC) WHERE deleted_at IS NULL AND visibility = 'public';
```

### Full-Text Search & Trigram Matching
```sql
CREATE INDEX idx_questions_fts ON public.questions USING GIN(fts);
CREATE INDEX idx_questions_title_trgm ON public.questions USING gin (title gin_trgm_ops);
CREATE INDEX idx_topics_name_trgm ON public.topics USING gin (name gin_trgm_ops);
CREATE INDEX idx_communities_name_trgm ON public.communities USING gin (name gin_trgm_ops);
CREATE INDEX idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_profiles_display_name_trgm ON public.profiles USING gin (display_name gin_trgm_ops);
```

### Polymorphic Engagement Partial Indexes
```sql
CREATE INDEX idx_reactions_user_question ON public.reactions (user_id, question_id) WHERE question_id IS NOT NULL;
CREATE INDEX idx_reactions_user_answer ON public.reactions (user_id, answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX idx_reactions_user_post ON public.reactions (user_id, post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_bookmarks_user_question ON public.bookmarks (user_id, question_id) WHERE question_id IS NOT NULL;
CREATE INDEX idx_bookmarks_user_post ON public.bookmarks (user_id, post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_comments_question ON public.comments (question_id, created_at ASC) WHERE question_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_comments_answer ON public.comments (answer_id, created_at ASC) WHERE answer_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_comments_post ON public.comments (post_id, created_at ASC) WHERE post_id IS NOT NULL AND deleted_at IS NULL;
```

### Operational & Security Lookups
```sql
CREATE INDEX idx_notifications_unread ON public.notifications (recipient_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_community_members_lookup ON public.community_members (community_id, user_id, role);
CREATE INDEX idx_blocks_lookup ON public.blocks (blocker_id, blocked_id);
CREATE INDEX idx_education_user_feed ON public.education (user_id, created_at DESC) WHERE university_id IS NOT NULL;
```

---

## 4. Row-Level Security (RLS) & Triggers

- **Profile Protection (`SEC-01`)**: `tr_protect_sensitive_profile_fields` aborts any client attempt to modify `system_role`, `is_verified`, `reputation_score`, or counters.
- **Community Privilege Escapes (`SEC-02`)**: Direct client `INSERT` on `community_members` enforces `role = 'member'`. Admin role creation is isolated inside `rpc_create_community`.
- **Question Resolution Guard (`SEC-04`)**: `tr_protect_question_resolution` validates that `accepted_answer_id` belongs to the question and is not deleted.
- **Two-Way Block Enforcement**: Public reading queries evaluate `is_blocked()` to ensure blocked users cannot interact or view profiles.
- **Automated Denormalized Counters**: Trigger functions `sync_question_answer_count`, `sync_comment_count`, `sync_community_member_count`, and `sync_reaction_counts` maintain real-time counters atomically.

---

## 5. Optimized Stored Procedures (RPCs)

All read-only procedures are declared `STABLE PARALLEL SAFE` to enable parallel worker query execution:
1. `get_home_feed(p_filter, p_limit, p_cursor_created_at, p_cursor_id)`: Keyset-paginated multi-stream feed.
2. `search_questions_fts(p_query, p_limit)`: Ranked full-text search with title trigram fallback.
3. `rpc_get_user_bookmarks()`: Single-query polymorphic bookmark fetch.
4. `accept_answer(p_question_id, p_answer_id)`: Transactional accepted answer + reputation bonus awards (+15).
5. `toggle_reaction(p_target_type, p_target_id, p_reaction_type)`: Atomic toggle returning updated counts.
6. `rpc_create_community(...)`: Transactional community creation and admin membership initialization.
7. `complete_onboarding(...)`: Atomic profile, education, and topic preference initialization.
8. `delete_own_account()`: GDPR account erasure.
