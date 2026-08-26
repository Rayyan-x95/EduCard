# Product Analytics

## North-star metric

### Useful Questions Resolved (UQR)

A question counts as resolved when:
- it receives an accepted answer, or
- the author marks an answer as solved/helpful according to the final product rule.

## Core events

### Acquisition
- app_installed
- app_opened
- signup_started
- signup_completed

### Onboarding
- onboarding_started
- onboarding_completed
- onboarding_skipped
- education_added
- interests_selected

### Content
- post_created
- question_created
- answer_created
- comment_created
- reaction_created
- bookmark_created
- question_solved
- answer_accepted

### Discovery
- search_performed
- profile_viewed
- community_viewed
- community_joined
- topic_followed
- user_followed

### Trust
- verification_started
- verification_completed
- report_created
- block_created

### Retention
- session_started
- feed_viewed
- question_viewed
- return_session

## Funnels

### Activation
Install → Signup → Onboarding → First question → First answer received

### Resolution
Question → Answer → Helpful → Solved

### Contributor
Signup → Browse → First answer → Second answer → Repeat contributor

## Metrics

- DAU/WAU/MAU
- D1/D7/D30 retention
- Questions/user
- Answers/question
- % questions receiving answer
- Median time to first answer
- % questions solved
- Helpful answer rate
- Contributor activation
- Report rate
- Moderation action rate

## Analytics principles

Do not track sensitive content unnecessarily.

Do not record raw private messages.

Use stable anonymous/user identifiers according to privacy requirements.

Analytics should inform product decisions, not become surveillance.
