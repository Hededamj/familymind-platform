# FamilyMind 2.0: Retention-First Product Strategy

**Date:** 2026-02-14
**Revised:** 2026-02-14 (v2 -- structural clarity revision)
**Status:** Draft
**Authors:** Jacob Hummel, Claude (Strategic Partner)

---

## Executive Summary

FamilyMind is a subscription-based parenting platform migrating from NewZenler to a custom-built Next.js application. The platform serves 800+ members and suffers from churn at approximately 1.5 months.

**What we now know about churn:**

Churn is caused by:
- Lack of structural clarity -- users don't know what to do next
- Low ongoing usage -- no reason to return after initial consumption
- Missing "red thread" -- no coherent through-line connecting content
- Cognitive overload -- catalog navigation creates decision fatigue

Churn is NOT caused by:
- Poor content quality (content is good)
- Misaligned audience (the right people are signing up)
- Lack of community (community is a feature, not the fix)

**Core thesis, revised:** Parents don't churn because they lack community or transformation narratives. They churn because the product has no structure. They open the platform, don't know where to go, feel overwhelmed, and stop coming back. **The fix is structural, not aspirational.**

**Strategic direction:** Transform from a flat video catalog into a **structured parenting platform** with clear navigation, flexible content packaging, and a layered architecture that supports subscription, one-time purchases, bundles, and future B2B expansion.

---

## Table of Contents

1. [Revised Churn Diagnosis](#1-revised-churn-diagnosis)
2. [System Hierarchy](#2-system-hierarchy)
3. [Layer Architecture](#3-layer-architecture)
4. [Content Layer](#4-content-layer)
5. [Product & Monetization Layer](#5-product--monetization-layer)
6. [Journey Layer](#6-journey-layer)
7. [Engagement Layer](#7-engagement-layer)
8. [Community Layer](#8-community-layer)
9. [90-Day Engagement Model](#9-90-day-engagement-model)
10. [Re-engagement & Notification Strategy](#10-re-engagement--notification-strategy)
11. [Progress Visibility](#11-progress-visibility)
12. [Retention KPIs](#12-retention-kpis)
13. [Architectural Principles Before Implementation](#13-architectural-principles-before-implementation)
14. [What We Deliberately Defer](#14-what-we-deliberately-defer)

---

## 1. Revised Churn Diagnosis

### What's Actually Happening

The 1.5-month churn pattern is a structural problem, not a value problem. The content is good. The audience is right. But the *container* is wrong.

### 1.1 No Structural Clarity

Users land on the platform and face a catalog. No hierarchy. No suggested starting point. No "you are here." The cognitive load of choosing what to watch is higher than the motivation to watch anything. Many users bounce not because they're done, but because they're lost.

### 1.2 Low Ongoing Usage

Without a clear reason to return weekly, usage decays naturally. The platform is not part of any habit loop. There's no "new thing waiting for you" and no "unfinished thing pulling you back." Once initial curiosity fades, the platform becomes invisible.

### 1.3 Missing Red Thread

Content exists as isolated units. A parent might watch a video on tantrums, then one on sleep, then one on boundaries -- but there's no connective tissue. No sense that these are steps in a progression. Each video is a dead end rather than a doorway.

### 1.4 Cognitive Overload

A flat catalog of 6-12 topic areas with multiple videos each is a decision tree, not a product. Decision fatigue is real, especially for exhausted parents. The paradox of choice applies: more options reduce engagement rather than increasing it.

### What This Means for Architecture

The primary job of the platform is **reducing cognitive load and providing one clear next step at every moment.** Everything else -- community, gamification, transformation narrative -- is secondary to this structural foundation.

---

## 2. System Hierarchy

The v1 strategy treated Journey, Community, and Engagement as co-equal pillars. That was wrong. The revised hierarchy is strict and sequential:

```
PRIORITY A ─── STRUCTURAL CLARITY
               One clear next step. Always.
               │
               │ Must be solid before investing in:
               ▼
PRIORITY B ─── ENGAGEMENT LAYER
               Weekly rhythm. Check-ins. Progress visibility.
               │
               │ Must show retention signal before investing in:
               ▼
PRIORITY C ─── COMMUNITY LAYER
               Optional. Modular. Not a retention dependency.
```

**Why this order matters:**

- Structure without engagement still works (clear content, good navigation = usable product).
- Engagement without structure fails (nudging users back to a confusing platform accelerates churn).
- Community without structure and engagement is a ghost town.

Each layer is **independently valuable** and **independently deployable**. Community does not depend on engagement. Engagement does not depend on community. But both depend on structural clarity.

---

## 3. Layer Architecture

The platform is composed of five distinct layers. Each layer has a clear responsibility and clean boundaries with the others.

```
┌─────────────────────────────────────────────────────────┐
│                    FAMILYMIND 2.0                        │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              COMMUNITY LAYER (Phase 3)             │  │
│  │         Discussion · Cohorts · Live Events         │  │
│  ├───────────────────────────────────────────────────┤  │
│  │             ENGAGEMENT LAYER (Phase 2)             │  │
│  │     Weekly rhythm · Check-ins · Notifications      │  │
│  │              Progress · Re-engagement              │  │
│  ├───────────────────────────────────────────────────┤  │
│  │              JOURNEY LAYER (Phase 1b)              │  │
│  │     Structural wrapper · Sequencing · Phases       │  │
│  │          "Red thread" across content               │  │
│  ├───────────────────────────────────────────────────┤  │
│  │        PRODUCT & MONETIZATION LAYER (Phase 1a)     │  │
│  │   Subscription · One-time · Bundles · Discounts    │  │
│  │            Access control · B2B-ready              │  │
│  ├───────────────────────────────────────────────────┤  │
│  │              CONTENT LAYER (Foundation)             │  │
│  │     Videos · Lessons · Resources · Metadata        │  │
│  │          The atomic units of the platform          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key architectural property:** Each layer only depends on the layers below it. Community can be removed without breaking engagement. Engagement can be removed without breaking journeys. Journeys can be removed without breaking content or monetization. The content and product layers are the foundation.

---

## 4. Content Layer

The content layer is the foundation. Everything else is built on top of it.

### 4.1 Content as Atomic Units

Content exists as individual, self-contained units with rich metadata. A content unit is not "a course" -- it's a single lesson, video, or resource that can be composed into any higher-level structure.

**Content unit properties:**
- Title, description, thumbnail
- Media (video, audio, PDF, text)
- Duration / estimated time
- Topic tags (e.g., sleep, boundaries, emotional regulation)
- Age relevance range (e.g., 2-4 years)
- Difficulty / depth level (introductory, intermediate, advanced)
- Standalone flag (can this be consumed independently?)
- Prerequisites (optional: other content units that should come first)

### 4.2 Content Composition

Content units compose upward into higher-level structures, but the content layer itself is flat. Composition happens in the product and journey layers.

```
CONTENT LAYER (flat, tagged, searchable):
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │Lesson A│ │Lesson B│ │Lesson C│ │Lesson D│ │Lesson E│ ...
  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
       │           │          │          │          │
       ▼           ▼          ▼          ▼          ▼
  Tags, metadata, age ranges, difficulty, prerequisites

PRODUCT LAYER (composes content into sellable units):
  ┌─────────────────────┐  ┌──────────┐  ┌─────────────┐
  │ Course: "Sleep 101" │  │ Single   │  │ Bundle:     │
  │ [A] → [B] → [C]    │  │ [D]      │  │ [Course +D] │
  └─────────────────────┘  └──────────┘  └─────────────┘

JOURNEY LAYER (composes content into guided sequences):
  ┌─────────────────────────────────────────┐
  │ Journey: "First Year Foundations"        │
  │ Week 1: [A] + action + reflection       │
  │ Week 2: [B] + action + reflection       │
  │ Week 3: [D] + action + reflection       │
  └─────────────────────────────────────────┘
```

**Critical point:** The same content unit (Lesson A) can appear in a course, a bundle, AND a journey simultaneously. Content is never locked to a single container.

### 4.3 Content Admin

The platform needs a CMS-like admin interface for the FamilyMind team to:
- Create and edit content units with metadata
- Tag and categorize content
- Preview content as a user would see it
- Manage media uploads (or references to external video hosting)

---

## 5. Product & Monetization Layer

This layer turns content into things people can buy. It must support multiple monetization models from Day 1, because migrating payment models later is painful and disruptive.

### 5.1 Product Types

| Product Type | Description | Example |
|-------------|-------------|---------|
| **Subscription** | Recurring access to a defined content scope | "FamilyMind All-Access: DKK X/month" |
| **Course (one-time)** | One-time purchase of a structured content sequence | "Sleep Training Masterclass: DKK Y" |
| **Single content** | One-time purchase of a standalone lesson | "Emergency Tantrum Guide: DKK Z" |
| **Bundle** | Discounted package of multiple courses/content | "Toddler Essentials Pack (3 courses): DKK W" |

### 5.2 Pricing & Discounts

- Per-product pricing (each product has its own price)
- Discount codes (percentage or fixed amount)
- Bundle discounts (buying together is cheaper than individually)
- Subscription tiers (if needed later: basic vs. premium)
- Trial periods (e.g., 7-day free trial for subscription)

### 5.3 Access Control

The access control model determines what a user can see and do:

```
User has Entitlements → Entitlements unlock Content

Entitlement sources:
  - Active subscription → unlocks subscription-tier content
  - Purchased course → unlocks that course's content (permanently)
  - Purchased bundle → unlocks all bundled content (permanently)
  - Purchased single → unlocks that content unit (permanently)
  - B2B license → unlocks organization-scoped content
  - Free tier → unlocks designated free content
```

**Key design decision:** One-time purchases grant permanent access, even if a subscription lapses. This prevents the toxic pattern of "I bought this course but lost access when I cancelled my subscription."

### 5.4 B2B Readiness

B2B is not built in Phase 1, but the architecture must not prevent it. This means:

- Users belong to an organization (default: personal)
- Access control checks organization-level entitlements in addition to personal ones
- A future B2B admin can manage seats, assign content, and view aggregate usage
- The data model supports multi-tenancy from Day 1 (even if the UI doesn't)

**What "B2B ready" means technically:**
- User model has an optional `organizationId` field
- Entitlements can be scoped to organization or individual
- No hard-coded assumption that a user is always a direct consumer
- Reporting can be filtered by organization

---

## 6. Journey Layer

**The journey is a structural wrapper, not the core product.**

In v1, the journey was positioned as the central experience -- a 12-week guided transformation. That was over-prescribed. The revised model treats journeys as one way to consume content, not the only way.

### 6.1 What a Journey Actually Is

A journey is a **curated sequence of content units with added structure**: an order to follow, micro-actions to try, and reflection prompts to answer. It provides the "red thread" that the catalog lacks.

**A journey is NOT:**
- Required (users can still browse and buy individual content)
- Fixed at 12 weeks (journeys can be 3 weeks, 6 weeks, 12 weeks, or open-ended)
- The only navigation path (catalog/explore mode remains available)
- A replacement for courses (a course is a product; a journey is a structural experience)

### 6.2 Journey Structure

```
Journey
  ├── Metadata (title, description, target audience, estimated duration)
  ├── Phase 1: [label]
  │     ├── Week 1
  │     │     ├── Content unit (from content layer)
  │     │     ├── Micro-action ("Try this with your child")
  │     │     └── Reflection prompt ("How did it go?")
  │     ├── Week 2 ...
  │     └── Week N ...
  ├── Phase 2: [label] (optional)
  │     └── ...
  └── Completion state
```

**Flexibility:**
- A journey can be 1 phase or 4 phases
- A phase can be 1 week or 6 weeks
- A week can have 1 content unit or 3
- Phases and weeks are defined by the FamilyMind team per journey, not hard-coded

### 6.3 Journey vs. Course vs. Catalog

| Dimension | Catalog (Browse) | Course (Product) | Journey (Wrapper) |
|-----------|------------------|-------------------|-------------------|
| Structure | None (flat) | Ordered lessons | Ordered + paced + actions |
| Pacing | Self-directed | Self-paced | Weekly cadence |
| Actions | None | None | Micro-actions + reflections |
| Monetization | Via subscription | Direct purchase | Part of subscription |
| User mindset | "Let me find something" | "Let me learn this" | "Guide me through this" |

**The journey is the primary retention mechanism for subscribers.** Courses and standalone content are the primary acquisition and monetization mechanisms. Both coexist, sharing the same content layer.

### 6.4 How Users Encounter Journeys

After onboarding (a lightweight profile quiz), subscribers see a recommended journey based on their child's age and stated challenge. They can:

1. Start the recommended journey (primary CTA)
2. Browse other available journeys
3. Browse the content catalog directly
4. Access any purchased courses

The platform always shows **one clear next step**: "Continue Week 3 of your journey" or "Start here" for new users. This is the structural fix for cognitive overload.

---

## 7. Engagement Layer

The engagement layer creates reasons to return. It wraps around the journey and content layers to add rhythm, progress tracking, and re-engagement.

### 7.1 Weekly Rhythm

For users on a journey, the platform creates a weekly cadence:

| Day | Touchpoint | Purpose |
|-----|-----------|---------|
| Monday | "Your week is ready" | New content unlocked |
| Mid-week | "Have you tried your action?" | Gentle nudge (only if content not yet opened) |
| Friday | "How did it go?" | Reflection check-in |

**For users NOT on a journey** (course-only or browse-only users), the engagement layer is lighter:
- Weekly content recommendation based on their interests/history
- Progress indicator for in-progress courses
- "New content" notifications when relevant content is added

### 7.2 Check-ins

The check-in is the simplest possible feedback loop:

> *"This week you tried [action]. How did it go?"*
> - It worked well
> - Mixed results
> - It was hard / didn't work
> - I didn't get to try it

One tap. This creates:
- A data point for the user's personal progress record
- Signal for the platform to adjust (e.g., offer a follow-up tip)
- A sense of completion for the week

### 7.3 Progress Visibility

Progress is the primary retention motivator. Not gamification -- visibility.

**What to show:**

| Mechanism | Example | Why It Works |
|-----------|---------|-------------|
| Journey progress | "Week 4 of 8 -- Phase 1 complete" | Momentum without competition |
| Course progress | "3 of 7 lessons completed" | Standard, expected, effective |
| Personal record | Accumulated check-in history | "Look what I've practiced" |
| Milestone markers | "You completed Phase 1: Foundations" | Celebrates commitment |
| Growth snapshots | Monthly: "You practiced 4 techniques this month" | Self-referenced, not comparative |

**What NOT to use:**

| Mechanism | Why Not |
|-----------|---------|
| Points / XP | Trivializes parenting |
| Streaks | Punishes real life (sick kid breaks a streak) |
| Leaderboards | Competitive parenting is toxic |
| Badges for consumption | Rewards watching, not growing |

### 7.4 Notification Strategy

**Core principle:** Parents are overwhelmed. Notifications must feel like a supportive friend, not another obligation.

**The notification ladder** (escalate based on inactivity):

| State | Timing | Message Approach |
|-------|--------|-----------------|
| On track | Monday + mid-week if needed | Weekly plan, content-forward |
| 3-5 days inactive | Single nudge | Value-forward: "This week's focus is [topic]. It's a short one -- 6 minutes." |
| 7-10 days inactive | Single nudge | Social proof (if community enabled): "Parents in your group tried [action]." |
| 14+ days inactive | Single nudge | Empathy reset: "Life happens. Your journey picks up where you left off." |
| 30+ days inactive | One-time | Re-onboarding: "Want to update your focus?" |

**Hard rules:**
- Max 2 outbound touches per week for active users
- Max 1 per week for inactive users
- Never: "You're falling behind!", streak resets, "Don't miss out!", login-count shaming

**Channel priority:** In-app > Email > Push (opt-in only). No SMS.

---

## 8. Community Layer

**Community is Phase 3. It is modular, optional, and not a retention dependency.**

The v1 strategy positioned cohort community as a core pillar. The churn data shows this was premature. Structure and engagement must prove retention impact before community investment.

### 8.1 When to Build Community

Community becomes relevant when:
- Structural clarity is shipped and validated (Phase 1)
- Engagement layer shows measurable retention improvement (Phase 2)
- There is demand signal from users (requesting peer interaction)

### 8.2 Community Model (When Built)

| Model | Recommendation |
|-------|---------------|
| Open forum (everyone) | Avoid. High moderation, low retention impact. |
| Cohort groups (15-30) | Preferred. Small, journey-linked, time-bounded. |
| 1:1 matching | Later. Requires critical mass. |
| Live events (Q&A) | Supplement. Can start before full community buildout. |

### 8.3 Architectural Requirement

Even though community is deferred, the data model should not prevent it. This means:
- Users can be assigned to groups
- Content/journey context can be shared in a discussion thread
- The engagement layer can incorporate community signals (when available)

No community UI needs to be built in Phase 1 or Phase 2.

---

## 9. 90-Day Engagement Model

Designed to get users past the 1.5-month churn cliff. Revised to reflect structural-clarity-first priorities.

### Days 1-7: "Welcome Week" (Activation)

- **Goal:** User completes onboarding and reaches their first "next step"
- **Key moment:** The platform shows a clear, personalized starting point -- not a catalog
- **Touchpoints:** Welcome email, onboarding quiz, first recommended journey or course
- **Success metric:** Completed onboarding + opened first content piece
- **Anti-churn:** If onboarding not completed by Day 3, send "Let's get you started" with a direct link to the quiz

### Days 8-30: "Building the Habit" (Weeks 2-4)

- **Goal:** User returns at least 3 times organically (not just from nudges)
- **Key moment:** First check-in completed -- the user experiences the feedback loop
- **Touchpoints:** Weekly plan notification, mid-week action reminder, end-of-week reflection
- **Success metric:** 3/4 weekly cycles completed
- **Anti-churn:** If a week is missed, no punishment: "Life happens. Here's a 3-minute version of what you missed."

### Days 31-60: "Past the Cliff" (THE CHURN DANGER ZONE)

- **Goal:** User crosses from "trying this out" to "this is part of my routine"
- **Key moment:** Progress becomes visible -- "Here's what you've practiced this month"
- **Touchpoints:** Monthly progress summary, next phase preview, content recommendation based on history
- **Success metric:** User opens the platform at least once per week without requiring a nudge
- **Anti-churn:** Monthly retrospective email that shows personal progress and previews upcoming content

### Days 61-90: "Habit Lock-In"

- **Goal:** User has a routine and visible progress they'd feel loss aversion about
- **Key moment:** Phase or journey completion + "What's next?" prompt
- **Touchpoints:** Completion celebration, next journey recommendation, invitation to explore new topic area
- **Success metric:** User begins a second journey or explores new content area
- **Anti-churn:** The user now has history and progress they'd lose by leaving

---

## 10. Re-engagement & Notification Strategy

(Unchanged from section 7.4 -- included here as standalone reference.)

The notification strategy is defined in the Engagement Layer (Section 7.4). The key principles:

1. Escalate gradually based on inactivity duration
2. Lead with value and empathy, never guilt
3. Respect attention limits (max 2 touches/week active, 1/week inactive)
4. Channel priority: In-app > Email > Push (opt-in)
5. Highest-performing pattern: peer stories and content previews

---

## 11. Progress Visibility

(Unchanged from section 7.3 -- included here as standalone reference.)

The progress system is defined in the Engagement Layer (Section 7.3). Summary:

- Show journey progress, course progress, and personal practice history
- Use self-referenced progress ("here's what YOU practiced"), not comparative metrics
- Celebrate milestones without ranking, streaks, or points
- Monthly growth snapshots as re-engagement tools

---

## 12. Retention KPIs

### Primary (Board-Level)

| KPI | Current (Est.) | Target | Timeline |
|-----|---------------|--------|----------|
| Monthly churn rate | ~40-50% | < 8% | 12 months |
| 90-day retention | ~15-20% | > 55% | 6 months |
| LTV:CAC ratio | Unknown | > 3:1 | 9 months |
| Net Revenue Retention | Unknown | > 95% | 12 months |

### Structural Clarity (New -- Leading Indicators)

| KPI | Target | Description |
|-----|--------|-------------|
| Onboarding completion rate | > 80% | % of new users who complete the quiz and see their first recommendation |
| Time to first content | < 5 min | Time from signup to first content interaction |
| "Next step" visibility | 100% | % of sessions where the user sees a clear next action on their dashboard |
| Navigation depth | < 3 clicks | Average clicks to reach relevant content from dashboard |

### Engagement (Leading Indicators)

| KPI | Target | Description |
|-----|--------|-------------|
| Week 1 activation rate | > 80% | % completing onboarding + first content |
| Weekly active rate | > 45% | % engaging at least once per week |
| Action completion rate | > 25% | % completing the weekly micro-action (journey users) |
| Journey progression rate | > 55% | % advancing to the next week's content |
| Course completion rate | > 40% | % completing a purchased course |

### Health (Early Warning Triggers)

| KPI | Trigger | Action |
|-----|---------|--------|
| Days since last visit | > 10 days | Notification ladder escalation |
| Content velocity drop | 50% drop week-over-week | Investigate content-user alignment |
| Onboarding drop-off | < 70% completion | Simplify quiz, add "skip for now" |
| Dashboard bounce rate | > 40% | Dashboard is not providing clear next step -- redesign |

---

## 13. Architectural Principles Before Implementation

These principles must govern every technical decision. When in doubt, refer back here.

### Principle 1: Content is Atomic, Composition is Separate

Content units are the smallest indivisible pieces (a video, a lesson, a resource). They carry metadata but no structural opinion. All structure -- courses, bundles, journeys -- is composed *above* the content layer. A content unit never "knows" what course or journey it belongs to.

**Why:** This prevents content lock-in. The same video can be in a course, a bundle, a journey, and the browse catalog simultaneously without duplication. It also makes re-packaging content for B2B trivially easy.

### Principle 2: Monetization and Structure are Separate Concerns

A *product* (course, bundle, subscription) is a monetization wrapper. A *journey* is a structural wrapper. They are independent. A journey can span content from multiple products. A product can exist without any journey. The access control system checks entitlements from the product layer; the journey layer does not handle access.

**Why:** Coupling monetization to structure creates rigidity. If journeys are only available to subscribers, you can't offer a "free sample journey." If courses can only be consumed linearly, you can't add them to bundles flexibly.

### Principle 3: Layers Are Independently Deployable

Each layer (content, product, journey, engagement, community) can be built, shipped, and iterated on independently. The platform is functional with only the content and product layers. Each additional layer adds value but is not a prerequisite for the layers below it.

**Why:** This enables phased delivery without architectural debt. Phase 1 ships a working product. Phase 2 adds engagement. Phase 3 adds community. No layer requires rework to support the next.

### Principle 4: One Clear Next Step, Always

Every user-facing screen must answer the question: "What should I do now?" The dashboard shows the user's active journey week, their in-progress course, or a personalized recommendation. Never a blank catalog. Never a "browse our library" as the primary CTA.

**Why:** This is the direct fix for the #1 churn cause. Structural clarity is not a feature -- it is the product's primary job.

### Principle 5: Multi-Tenancy from Day 1

The data model supports organizational context even before B2B features are built. Every user has an implicit organization (personal by default). Entitlements, reporting, and content access can be scoped by organization. No schema migration required when B2B launches.

**Why:** Adding multi-tenancy retroactively is one of the most expensive refactors in SaaS. A nullable `organizationId` on the user model costs nothing now and saves months later.

### Principle 6: Flexible Content Packaging Over Rigid Journeys

The platform supports short courses (3 lessons), long programs (30 lessons), standalone videos, curated bundles, and guided journeys of any length. No single content format is privileged in the data model. The admin interface makes it equally easy to create a 3-lesson course and a 12-week journey.

**Why:** v1 over-indexed on the 12-week journey as the default. Real content needs vary. Some topics need a 20-minute standalone video. Some need an 8-week program. The architecture should be indifferent to format.

### Principle 7: Measure Structure, Not Just Engagement

Traditional SaaS metrics (DAU, MAU, session length) don't capture structural clarity. Add metrics that specifically measure whether users know what to do: time to first content, dashboard bounce rate, navigation depth, "next step" visibility. If users are engaged but confused, engagement metrics will look fine right before churn spikes.

**Why:** Engagement without clarity is noise. A user who logs in, browses aimlessly, and leaves had a "session" but no value.

### Principle 8: Admin-First Content Management

The FamilyMind team must be able to create, edit, sequence, and publish content without developer involvement. The admin interface is not an afterthought -- it is a first-class product. If creating a new journey or adjusting a course requires code changes or database edits, the platform has failed.

**Why:** Content velocity determines product velocity. If the team can't ship new journeys and courses independently, the platform bottlenecks on engineering.

---

## 14. What We Deliberately Defer

| Feature | Why Defer | Prerequisite |
|---------|-----------|--------------|
| Community features | Structure and engagement must prove retention first | Phase 2 retention data |
| AI-powered journey generation | Manual curation ensures quality; not enough data yet | 4+ manually curated journeys |
| B2B admin portal | B2C model must be validated first | Proven retention + revenue model |
| Native mobile app | Responsive web is sufficient to validate | Product-market fit confirmed |
| Live video/streaming | Use Zoom or similar, link from platform | Community engagement proven |
| Advanced personalization | Simple rule-based recommendations first | Sufficient user behavior data |
| 1:1 accountability matching | Requires critical mass | Community layer validated |

---

## Assumptions to Validate

1. A lightweight onboarding quiz (4 questions, < 2 min) is sufficient to generate a useful recommendation
2. Existing video content can be organized into both courses (product layer) and journeys (structural layer) without significant gaps
3. Weekly cadence is the right rhythm for the target audience (not too fast, not too slow)
4. "One clear next step" on the dashboard measurably reduces bounce rate vs. a catalog view
5. Users who complete one journey will start a second (conversion at journey completion)
6. The product/monetization model (subscription + one-time + bundles) does not create confusing access control for users

---

## Phased Delivery Overview

| Phase | Focus | Layers Built | Key Deliverable |
|-------|-------|-------------|-----------------|
| **1a** | Foundation | Content + Product/Monetization | Platform with courses, bundles, subscription, one-time purchase, access control, admin CMS |
| **1b** | Structure | Journey | Guided journeys as structural wrapper, onboarding quiz, "one clear next step" dashboard |
| **2** | Retention | Engagement | Weekly rhythm, check-ins, notifications, progress visibility, re-engagement ladder |
| **3** | Growth | Community | Cohort groups, discussion, moderation tools |

Each phase ships independently. Each phase is validated before the next begins.

---

## Next Steps

1. Review and approve this revised strategy
2. Audit existing content: map videos to potential courses, bundles, and journey sequences
3. Create implementation plan (technical architecture, data model, phase milestones)
4. Begin Phase 1a build on the Next.js scaffold

---

*The platform's job is structural clarity. Everything else serves that goal or waits its turn.*
