# API and Data Contracts

EduCard primarily uses Supabase client APIs, PostgreSQL queries/RPCs and Edge Functions.

## Client query conventions

Use TanStack Query keys such as:

- ['feed', feedType, cursor]
- ['question', questionId]
- ['question-answers', questionId, cursor]
- ['profile', userId]
- ['community', communityId]
- ['community-posts', communityId, cursor]
- ['notifications', cursor]
- ['search', query, type]

## Core operations

### Auth
- signUp
- signIn
- signInWithOAuth
- signOut
- resetPassword

### Profiles
- getProfile
- updateProfile
- getProfileByUsername

### Questions
- createQuestion
- getQuestion
- listQuestions
- updateQuestion
- deleteQuestion
- markQuestionSolved

### Answers
- createAnswer
- updateAnswer
- deleteAnswer
- acceptAnswer
- markAnswerHelpful

### Posts
- createPost
- getPost
- listFeed
- updatePost
- deletePost
- reactToPost
- bookmarkPost

### Communities
- createCommunity
- getCommunity
- joinCommunity
- leaveCommunity
- listCommunityMembers

### Social
- followUser
- unfollowUser
- blockUser
- unblockUser

### Moderation
- reportContent
- reportUser

## Edge Functions

Use Edge Functions for:
- Push notification dispatch
- Verification workflows
- Moderation workflows
- Privileged operations
- External service integration

## Error model

Return stable application error codes.

Examples:
- AUTH_REQUIRED
- FORBIDDEN
- NOT_FOUND
- VALIDATION_ERROR
- RATE_LIMITED
- CONTENT_BLOCKED
- COMMUNITY_RESTRICTED
- VERIFICATION_REQUIRED

Do not expose raw database errors to users.

## API principles

- Validate all inputs.
- Authorize every privileged action.
- Keep mutations idempotent where practical.
- Return minimal data.
- Avoid N+1 queries.
- Prefer database views/RPCs for complex read models.
