# Product Requirements Document — EduCard

## 1. Overview

EduCard is a global student knowledge network connecting students with peers, alumni, currently employed professionals, and mentors.

It combines the conversational nature of social platforms with the durable utility of a question-and-answer knowledge base.

## 2. Problem

Students repeatedly encounter problems that are difficult to solve through conventional search:

- What should I learn for a career?
- How did someone get their first internship?
- Is a particular degree or certification worth it?
- How should I approach a difficult subject?
- What is university life actually like?
- What mistakes should I avoid?
- How do I transition from education into work?

Existing social platforms are either too broad, too career-centric, too anonymous, or optimized for engagement instead of useful resolution.

## 3. Target users

### Primary: Students
High-school graduates, university students, vocational students, postgraduate students, and lifelong learners.

### Secondary: Alumni
Graduates who can share education and career experience.

### Secondary: Professionals
Currently employed people who can provide industry perspectives.

### Secondary: Mentors/Experts
Verified individuals providing structured guidance.

### Institutional users — later
Universities, student organizations, career centers, and employers.

## 4. Core value proposition

For students:
> Ask people who have already been where you are.

For contributors:
> Turn your experience into guidance that helps the next student.

## 5. Product pillars

### Ask
Students ask real questions.

### Connect
Students discover people with relevant experience.

### Learn
Useful answers remain searchable and reusable.

## 6. Goals for V1

- Make it extremely easy to ask a question.
- Make relevant answers discoverable.
- Establish contextual trust around contributors.
- Create repeatable student-to-experienced-person interactions.
- Build a searchable knowledge graph from community activity.
- Establish basic safety and moderation.

## 7. Non-goals for V1

- Job marketplace
- Paid mentorship marketplace
- Full university management system
- Long-form LMS
- Video-first social network
- AI-first answer generation
- Complex recommendation engine
- Public advertising platform
- Crypto/token features

## 8. Core user journeys

### Student onboarding
Install → sign up → choose country → university/education → degree/field → year/status → interests → personalized home.

### Ask a question
Home → Ask → write question → select topics → optional community → publish → receive answers → interact → mark useful/solved.

### Answer a question
Discover question → inspect contributor context → answer → receive feedback → build reputation.

### Discover people
Search/topic/community → profile → education/work context → follow → interact.

### Join community
Discover → community page → join → feed filtered to community.

## 9. Functional requirements

### Authentication
- Email/password
- Google
- Apple
- Session persistence
- Account recovery
- Email verification

### Profiles
- Display name
- Avatar
- Bio
- Country/region
- Education
- Current status
- Field/interests
- Role labels
- Verification status
- Posts/questions/answers
- Following/followers
- Privacy settings

### Posts
- Text
- Images
- Topic tags
- Community association
- Comments
- Helpful reactions
- Bookmarks
- Share
- Report
- Delete/edit own content

### Questions
- Question title/body
- Topics
- Community
- Answer list
- Solved state
- Accepted answer
- Helpful answer signal
- Related questions

### Communities
- Name
- Description
- Topic/category
- Rules
- Members
- Posts/questions
- Moderators

### Search
- People
- Questions
- Posts
- Communities
- Topics
- Universities

### Notifications
- Answer received
- Comment received
- Mention
- Follow
- Answer marked solved
- Community activity
- Moderation notices

### Trust
- Student
- Alumni
- Professional
- Mentor
- Verified institution/experience where supported

### Safety
- Report
- Block
- Mute
- Moderation states
- Moderator review

## 10. UX principles

- One obvious primary action: Ask.
- Questions should feel more important than vanity metrics.
- Show why a contributor is relevant.
- Avoid follower-count obsession.
- Keep reading and answering friction low.
- Make solved answers visually obvious.
- Never hide reporting/blocking behind multiple menus.

## 11. Success metrics

North-star metric:
**Useful questions resolved**

Supporting metrics:
- Questions receiving at least one answer
- Questions marked solved
- Median time to first useful answer
- Weekly active students
- Week-4 retention
- Answers per active contributor
- Helpful-answer rate
- Report rate
- Onboarding completion

## 12. Risks

### Cold start
Mitigation: launch by university/topic communities and seed high-quality questions.

### Low-quality answers
Mitigation: contextual profiles, reputation, moderation, solved/helpful signals.

### Spam
Mitigation: rate limits, verification, reports, automated moderation assistance.

### Harassment
Mitigation: blocking, reporting, moderation queues, DMs disabled in V1.

### Global complexity
Mitigation: country-neutral profile model and flexible education fields.

## 13. V1 acceptance criteria

A student can:
1. Create an account.
2. Complete onboarding.
3. Create a question.
4. Add topics.
5. Publish it.
6. Receive answers.
7. Comment.
8. Mark an answer useful/solved.
9. Search for questions.
10. Follow a community.
11. Receive notifications.
12. Report/block another user.

An experienced contributor can:
1. Create a profile.
2. Select an appropriate role.
3. Answer questions.
4. Build a visible contribution history.
5. Receive feedback.

## 14. Product principle for future features

Every new feature should answer at least one:
- Does it help students solve problems?
- Does it improve trustworthy connection?
- Does it preserve useful knowledge?
- Does it improve safety?

If not, it probably does not belong in the product.
