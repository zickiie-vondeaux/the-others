# The Others — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-26  
**Author:** Zickiie (Admin)  
**Status:** Draft — Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas](#3-user-personas)
4. [Technical Architecture](#4-technical-architecture)
5. [Free Tier Budget Plan](#5-free-tier-budget-plan)
6. [Authentication & Access Control](#6-authentication--access-control)
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 [User Profiles & Onboarding](#71-user-profiles--onboarding)
   - 7.2 [Calendar & Events](#72-calendar--events)
   - 7.3 [Gaming Library](#73-gaming-library)
   - 7.4 [Movie Library](#74-movie-library)
   - 7.5 [Personality Corner](#75-personality-corner)
   - 7.6 [Group Corner](#76-group-corner)
8. [Global UI/UX System](#8-global-uiux-system)
9. [Notification System](#9-notification-system)
10. [Real-time Architecture](#10-real-time-architecture)
11. [Gamification & Achievements](#11-gamification--achievements)
12. [Birthday Celebration System](#12-birthday-celebration-system)
13. [Database Schema](#13-database-schema)
14. [API Integrations](#14-api-integrations)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Constraints & Limitations](#16-constraints--limitations)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Open Questions](#18-open-questions)

---

## 1. Executive Summary

**The Others** is a private, invite-only web application built for a close-knit gaming friend group of up to 20 people. It serves as a shared living hub where members track shared gaming and movie experiences, coordinate events and birthdays, discover each other's personalities, and celebrate the group's unique identity.

The app is built entirely on free-tier infrastructure with zero recurring cost. It is responsive across desktop and mobile browsers and installable as a Progressive Web App (PWA).

---

## 2. Product Vision & Goals

### Vision Statement
> A single place where The Others live digitally — tracking what we've played, what we've watched, when we meet, and who we are.

### Primary Goals

| Goal | Metric |
|------|--------|
| Every member has an active profile | 20/20 profiles completed |
| The calendar reflects all birthdays and events | 0 missed birthdays |
| The gaming library captures every game played together | Group retroactively logs past games |
| The movie library has voting and watch history | At least 1 poll per movie night |
| Every member completes at least one personality test | 20/20 members have a personality entry |
| Group Corner shows a living picture of the group | Activity feed has at least 1 entry per week |

### Non-Goals

- This is NOT a chat application (no direct messaging)
- This is NOT a public social network (invite-only, max 20 users)
- This is NOT a streaming platform (no video hosting)
- This does NOT require any paid subscriptions or credit cards
- This does NOT store legal last names, addresses, or financial information
- This is NOT designed to scale beyond 20 users

---

## 3. User Personas

### Persona A: The Admin (Zickiie)
- Creates the app, manages invites, moderates content
- Can edit any profile, override any entry, manage members
- Responsible for invite link generation and revocation
- Has exclusive access to admin settings panel

### Persona B: The Active Member
- Logs in regularly, updates their profile, participates in polls
- Adds games to queues, marks movies watched, takes personality tests
- Reacts to activity feed entries, participates in availability polls

### Persona C: The Passive Member
- Logs in occasionally, mostly reads the Group Corner
- Has a profile filled out but rarely initiates activity
- Needs a non-overwhelming interface that doesn't punish low engagement

### Persona D: The Moderator (promoted by Admin)
- Can delete content, manage events, resolve conflicts
- Cannot manage members or revoke invites (admin-only)

---

## 4. Technical Architecture

### Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser / PWA)                │
│              Next.js 14 (App Router) + React             │
│                     Tailwind CSS                         │
│              Framer Motion (animations)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                  BACKEND / BaaS                          │
│               Supabase (free tier)                       │
│  ┌─────────────┐ ┌──────────┐ ┌────────────┐            │
│  │  PostgreSQL │ │   Auth   │ │  Storage   │            │
│  │  Database   │ │ (Google/ │ │ (avatars,  │            │
│  │  (500MB)    │ │ Discord) │ │  images)   │            │
│  └─────────────┘ └──────────┘ └────────────┘            │
│  ┌─────────────┐ ┌──────────────────────────┐           │
│  │  Realtime   │ │   Row Level Security     │           │
│  │ (WebSocket) │ │   (RLS Policies)         │           │
│  └─────────────┘ └──────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              EXTERNAL FREE APIs                         │
│  IGDB (via Twitch) │ TMDB │ Open Meteo (optional)        │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  DEPLOYMENT                              │
│                 Vercel (free tier)                       │
│        Automatic deploys from GitHub                     │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure (Next.js App Router)

```
the-others/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── (app)/
│   │   ├── dashboard/          ← Group Corner home
│   │   ├── calendar/
│   │   ├── gaming/
│   │   ├── movies/
│   │   ├── personality/
│   │   ├── group/
│   │   ├── profile/[username]/
│   │   └── admin/
│   └── api/
│       ├── igdb/
│       ├── tmdb/
│       └── invites/
├── components/
│   ├── ui/                     ← shadcn/ui components
│   ├── calendar/
│   ├── gaming/
│   ├── movies/
│   ├── personality/
│   └── group/
├── lib/
│   ├── supabase/
│   ├── igdb.ts
│   ├── tmdb.ts
│   └── personality/
├── public/
│   ├── manifest.json           ← PWA manifest
│   └── sw.js                   ← Service worker
└── supabase/
    └── migrations/             ← SQL schema files
```

### Key Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Components | shadcn/ui + Tailwind | Free, customizable, accessible. No license cost. |
| Animations | Framer Motion (free) | Confetti, transitions, card animations |
| Icons | Lucide React (free) | Consistent icon set, tree-shakeable |
| Date/Time | date-fns (free) | Lightweight date utility |
| Charts (Group Corner) | Recharts (free) | Activity graphs, personality radar charts |
| Form validation | React Hook Form + Zod (free) | Type-safe forms |
| State management | Zustand (free) | Lightweight global state |
| Drag & drop (game queue) | @dnd-kit (free) | Accessible drag-and-drop |

---

## 5. Free Tier Budget Plan

### Service Cost Breakdown

| Service | Free Tier Limit | Our Usage Estimate | Risk |
|---------|----------------|-------------------|------|
| **Supabase** | 500MB DB, 1GB storage, 50k MAU, 500k edge function invocations | ~50MB DB, ~200MB storage, 20 MAU | Very Low |
| **Vercel** | 100GB bandwidth/month, unlimited deploys | ~5GB/month | Very Low |
| **IGDB (Twitch)** | Free with Twitch dev account | ~100 req/session | Low |
| **TMDB** | Free, unlimited with API key | ~200 req/session | Very Low |
| **Google OAuth** | Free | 20 users | None |
| **Discord OAuth** | Free | 20 users | None |
| **GitHub** | Free private repo | 1 repo | None |

### Estimated Monthly Cost: **$0.00**

### Storage Budget (1GB Supabase Storage)

| Asset | Estimated Size | Total at 20 Users |
|-------|---------------|-------------------|
| Avatars (compressed 200x200px) | ~50KB each | ~1MB |
| Game cover overrides (optional) | ~100KB each | ~5MB (50 games) |
| Movie cover overrides (optional) | ~100KB each | ~5MB (50 movies) |
| **Total estimate** | | **~11MB of 1024MB** |

---

## 6. Authentication & Access Control

### Login Methods

Members can authenticate via either:

1. **Google Sign-In** — One-click OAuth via Google account. No password required.
2. **Discord OAuth** — One-click OAuth via Discord account. Natural fit for a gaming group.

Both providers are configured in the Supabase Auth dashboard at zero cost.

### Invite System

- Admin generates a single invite link from the Admin Panel
- The link contains a unique token stored in the `invites` table
- Anyone with the link can create an account
- Admin can revoke and regenerate the link at any time
- After signup, new members are placed in `role: 'member'` status
- Admin can see a list of all registered members

### Role Hierarchy

```
super_admin (Zickiie)
    └── moderator (promoted by admin)
            └── member (default for all)
```

| Permission | Member | Moderator | Admin |
|-----------|--------|-----------|-------|
| View all content | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ |
| Add games/movies | ✓ | ✓ | ✓ |
| Create events | ✓ | ✓ | ✓ |
| Delete own content | ✓ | ✓ | ✓ |
| Delete others' content | ✗ | ✓ | ✓ |
| Edit others' profiles | ✗ | ✗ | ✓ |
| Manage members | ✗ | ✗ | ✓ |
| Generate invite links | ✗ | ✗ | ✓ |
| Promote to moderator | ✗ | ✗ | ✓ |
| Access admin panel | ✗ | ✗ | ✓ |

### Row Level Security (RLS)

All database tables will have Supabase RLS policies enforced at the database level. This means even if the frontend code has a bug, the database will reject unauthorized reads and writes. Key policies:

- Users can only write to their own profile row
- Admin (`role = 'super_admin'`) bypasses all write restrictions
- All authenticated members can read all data (private group, trust all members)
- Anonymous (unauthenticated) users cannot read any data

---

## 7. Feature Specifications

---

### 7.1 User Profiles & Onboarding

#### Profile Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Display name | Text | Yes | What others see |
| Real name | Text | No | Stored privately, shown if they choose |
| IGN (In-Game Name) | Text | No | Their gaming alias |
| Avatar | Image upload or URL | No | Stored in Supabase Storage |
| Bio | Textarea (max 280 chars) | No | Short personal tagline |
| Birthday | Date (day + month + year) | Yes | Drives calendar, Zodiac, Numerology auto-calc |
| City | Text | No | City only, no address |
| Timezone | Auto-detected or manual | Yes | For event scheduling |
| Favorite game | Text + IGDB lookup | No | Displayed on birthday page |
| Favorite movie | Text + TMDB lookup | No | Displayed on birthday page |
| Favorite food | Text | No | Displayed on birthday page |
| Favorite color | Color picker (hex) | No | Displayed on birthday page |
| Favorite music / artist | Text | No | Displayed on birthday page |
| Gaming platforms | Multi-select checkboxes | No | PC, PS5, Xbox, Switch, Mobile, Other |
| Personality test results | Auto-populated | — | Filled by Personality Corner |

#### Birthday Wishlist (separate from profile)

A dedicated sub-page at `/profile/[username]/wishlist`:
- Freeform list of wishlist items
- Each item: name, optional URL (Amazon link, Steam page, etc.), optional note
- Admin can add items on behalf of any user
- Other members can "I want this too!" to indicate they'd love the same gift
- Marked items (fulfilled) can be hidden or shown by admin

#### Onboarding Flow

When a new member signs up for the first time, they are routed through a multi-step onboarding wizard before reaching the app:

```
Step 1: Welcome to The Others  →  Step 2: Your basics (name, IGN, avatar)
→  Step 3: Your birthday + platforms  →  Step 4: Your favorites (food, color, game, movie, music)
→  Step 5: About you (bio)  →  Step 6: All done — preview your profile card
```

- Each step is optional to skip (except birthday, which is required)
- Progress bar shows completion percentage
- Fun, branded copy ("The Others await you...")
- After onboarding, the activity feed shows "[Name] just joined The Others!" to all members

#### Profile Completion Indicator

A visual progress ring on the profile shows % complete. Encourages filling out all fields without pressure.

---

### 7.2 Calendar & Events

#### Event Types

| Type | Color Tag | Icon | Created By |
|------|-----------|------|------------|
| Birthday | Gold/yellow | 🎂 | Auto-generated from profiles |
| Game Night | Purple | 🎮 | Any member |
| Movie Night | Cyan | 🎬 | Any member |
| Meetup / IRL | Green | 📍 | Any member |
| Online Hangout | Blue | 💻 | Any member |
| Milestone | Pink | 🏆 | Admin/mod |
| Other | Gray | 📅 | Any member |

#### Calendar Views

- **Month view** — default landing, shows all events as colored dots/chips
- **Week view** — detailed 7-day view with time slots
- **List/Agenda view** — chronological list of upcoming events, easiest for mobile
- **Birthday mode** — filtered view showing only birthdays with countdown badges

#### Event Creation Flow

1. Click any date → "Create Event" modal opens
2. Fill in: title, type, description, date, start/end time, link (optional Discord/Zoom)
3. Option to attach a game from the Gaming Library or a movie from the Movie Library
4. Choose to "Schedule directly" OR "Start availability poll first"

#### Availability Poll (When2Meet Style)

When "Start availability poll first" is chosen:
1. Creator proposes a date range (e.g., "next 2 weeks")
2. A grid is generated — days on X axis, time slots on Y axis
3. All members fill in their availability by clicking/dragging green cells
4. Real-time: see other members' availability updating as they fill in
5. System highlights the slot with most overlap
6. Creator clicks "Confirm this time" → event is auto-created on the calendar
7. Members who were available get a notification that the session is confirmed

#### Calendar Features

- **Birthday auto-population**: When a member fills in their birthday in their profile, it auto-appears on the calendar annually
- **RSVP**: Members can mark "Going", "Maybe", or "Can't make it" on any event
- **RSVP counter**: Shows "4/8 going" on calendar chips
- **Countdown chips**: Events within 7 days show a countdown ("in 3 days")
- **Past events archive**: Completed events move to an archive view, not deleted
- **Recurring events**: Option to mark an event as weekly/monthly/annual recurring
- **iCal export**: Download an event as `.ics` for Google Calendar/Apple Calendar (free, no API needed)

---

### 7.3 Gaming Library

#### Game Entry & Search

- Search powered by **IGDB API** (free via Twitch developer account)
- Searching returns: game title, cover art, release year, genres, platforms, summary
- IGDB data is cached in the Supabase database to minimize API calls
- Manual entry fallback: if IGDB doesn't have the game, type it in manually

#### Game Statuses (Group Level)

| Status | Description | Who Sets It |
|--------|-------------|-------------|
| Currently Playing | Active group playthrough | Any member |
| Queue / Want to Play | Planned for the future | Any member |
| Played / Completed | Group has finished or played enough | Any member |
| Dropped / Abandoned | Started but stopped | Any member |

#### Game Statuses (Personal Level)

Each member can additionally set their own personal status on any game:

- **Playing solo** — I'm playing this on my own
- **Completed** — I personally finished this
- **Want to play** — I want to play this (adds to personal wishlist, others can pile on)
- **Not interested** — Private flag, not visible to others

#### Group Progress Display

On each game card, a member avatar row shows:
- Who has played/completed it (colored avatar ring)
- "4/8 members played this"
- A mini-bar showing group completion percentage

#### Game Wishlist Pile-On Feature

When a member marks a game with "Want to play" (personal), it appears in a shared **Game Wishlist** section visible to everyone. Other members can click "Me too!" — piling on. The activity feed shows:

> "Zickiie added Hollow Knight to their wishlist. 3 others piled on."

The more pile-ons, the higher it rises in the queue suggestion order.

#### Library Views

- **By Status** — tabs: Currently Playing | Queue | Completed | Dropped
- **By Genre** — filter by RPG, FPS, co-op, etc.
- **By Platform** — filter to only show games compatible with your platform
- **Multiplayer / Solo toggle** — filter for group-playable games
- **Grid view** — cover art dominant, visual library
- **List view** — compact, detail-first

#### Game Cards (components)

Each card shows:
- Cover art (from IGDB or custom)
- Title + Year
- Status badge
- Platform icons
- Group progress ring (how many played it)
- Tags: genre, multiplayer/solo
- "Suggest to group" button → creates an activity feed entry

#### Session Scheduler (from Gaming Library)

From any game in the library, a member can click "Schedule a Session":
- Opens the availability poll flow with the game pre-attached
- Once scheduled, appears on the calendar as a Game Night event
- Activity feed shows: "[Name] scheduled a game night: Lethal Company — check the calendar!"

---

### 7.4 Movie Library

#### Movie Entry & Search

- Search powered by **TMDB API** (free, no credit card required)
- Returns: title, poster, release year, genres, runtime, overview, cast
- TMDB data is cached in Supabase
- Manual entry fallback available

#### Movie Statuses (Group Level)

| Status | Color |
|--------|-------|
| Watch Queue | Purple |
| Currently Watching (ongoing series) | Cyan |
| Watched Together | Green |
| Watching Separately | Yellow |
| Did Not Finish | Gray |

#### Individual Watch Tracking

Each member can log for any movie:
- **Watched** with a date
- **Watching** (in progress)
- **Want to watch**
- **Not interested** (private)

Aggregate shown on movie card: "8/12 members watched this"

#### Movie Polls (Ranked Choice Voting)

**Creating a poll:**
1. Any member can create a "Movie Night Poll"
2. Options to populate poll candidates:
   - Pull automatically from the group's Watch Queue
   - Search and add manually
3. Poll has a deadline (e.g., "closes in 24 hours")
4. Members rank their options 1 → N
5. Winner calculated via Instant-Runoff Voting (IRV):
   - Round 1: Count all first-choice votes
   - If no majority, eliminate the last-place option, redistribute those voters' next choices
   - Repeat until a winner has >50%
6. Live results visible to all (with option to hide until poll closes — toggle)
7. Winner is highlighted and can be one-click added to the calendar as a Movie Night event

**Poll history**: Past polls are archived and visible in the Movie section.

#### Watch Party Scheduler

From any movie, click "Schedule Watch Party":
- Opens availability poll flow with movie pre-attached
- Confirmed → calendar Movie Night event created
- Members can add a streaming platform tag (Netflix, Prime, Disney+, YouTube, Pirated Confession Booth... 🏴‍☠️)

#### Movie Library Views

- **Tabs**: Watch Queue | Watching | Watched Together | All
- **Genre filter** — Horror, Comedy, Sci-Fi, Anime, etc.
- **Member filter** — "Show movies [Name] has watched"
- **Grid view** (posters) and **List view** (compact)

---

### 7.5 Personality Corner

The Personality Corner is each member's private-to-fill, public-to-view personality space. Members take quizzes, get results, and their results populate both their profile and the Group Corner.

#### Personality Systems Included

| # | System | Input Method | Auto-calc from Birthday? |
|---|--------|-------------|--------------------------|
| 1 | **MBTI** (16 personalities) | 20–30 question in-app quiz | No |
| 2 | **Enneagram** (9 types) | 20–30 question in-app quiz | No |
| 3 | **Western Zodiac** (Sun sign) | Birthday → auto-calculated | Yes |
| 4 | **Numerology / Life Path** | Birthday → auto-calculated | Yes |
| 5 | **Big Five / OCEAN** | 44-item IPIP questionnaire (public domain) | No |
| 6 | **Love Languages** (Gary Chapman's 5 types) | 15-question quiz | No |
| 7 | **Attachment Style** (4 types) | 20-question quiz | No |
| 8 | **Human Design** | Birth date + time + city → calculated | Yes (needs birth time) |
| 9 | **Chinese Zodiac** | Birth year → auto-calculated | Yes |
| 10 | **DISC Personality** | 28-question quiz | No |

#### Quiz Design Principles

- **Conversational format**: Questions are displayed one at a time, not as a long list
- **Fun, gaming-themed copy**: e.g., "When a teammate needs help in the middle of a boss fight, you..." 
- **Progress bar**: Shows quiz completion (e.g., "12/30")
- **Can retake**: Members can retake any quiz. Previous results are archived
- **Result reveal animation**: After finishing, a dramatic animated reveal of the result (Framer Motion)
- **Result explanation**: Each type gets a 3–5 sentence description + famous characters with that type
- **Share to Group Corner**: After revealing, a button "Share result with The Others" posts to the activity feed

#### Auto-Calculated Systems

Systems 3, 4, 8, 9 are calculated automatically from profile data. No quiz needed. Results appear automatically once birthday (and for Human Design, birth time) is entered.

| System | Calculation |
|--------|-------------|
| Western Zodiac | Sun sign from birthday day + month |
| Chinese Zodiac | Animal from birth year |
| Life Path Number | Sum all digits of full birthdate, reduce to 1–9 or 11, 22, 33 |
| Human Design | Requires birth date + time + city. Complex calculation — use a free API or pre-computed table |

#### Personality Profile Card

Each member's full personality card (visible to all members) shows:
- A stylized card with their avatar
- All completed test results displayed as badges
- Zodiac symbol + element + quality
- MBTI type name + 4-letter code
- Life path number + keyword
- Enneagram wing notation
- Compatibility hints (calculated against the viewing user's results)

---

### 7.6 Group Corner

The Group Corner is the social dashboard — the living, breathing view of The Others as a collective entity. It is the default landing page after login.

#### Sub-sections

```
Group Corner
├── Activity Feed          ← Real-time stream of everything happening
├── Personality Overview   ← Group-wide personality dashboard
├── Birthday Spotlight     ← Who's celebrating soon / today
├── Member Directory       ← Grid of all members with quick stats
└── Group Stats            ← Fun aggregate numbers about the group
```

#### Activity Feed

A real-time chronological feed of all activity across the app. Each entry is a card with:
- Member avatar
- Action text (e.g., "Zickiie completed her MBTI quiz and is an INFJ!")
- Timestamp (relative: "2 hours ago")
- Optional attached content (game card, movie poster, poll result)
- Reaction bar: emoji reactions (👏 😂 🔥 💜 etc.) — members click to react

**Events tracked in the feed:**

| Trigger | Feed Message |
|---------|-------------|
| Member joins | "[Name] just joined The Others! Say hi 👾" |
| Profile updated | "[Name] updated their profile" |
| Personality quiz completed | "[Name] took the [Test] and got [Result]!" |
| Game added | "[Name] added [Game] to the [Queue/Library]" |
| Game suggested to group | "[Name] is suggesting the group plays [Game]! 🎮" |
| Game session scheduled | "[Name] scheduled a game night: [Game] — [Date]. Check the calendar!" |
| Game wishlist added | "[Name] added [Game] to their wishlist. Want it too?" |
| Pile-on | "[Name] + 2 others want [Game] too!" |
| Movie watched | "[Name] watched [Movie]" |
| Movie poll created | "[Name] started a movie night poll. Vote now!" |
| Poll voted | "The poll for movie night is heating up! 5 votes in." |
| Poll winner announced | "The group chose [Movie] for movie night! 🎬" |
| Movie night scheduled | "[Name] scheduled a movie night: [Movie] — [Date]" |
| Achievement unlocked | "[Name] unlocked: [Achievement Name] 🏆" |
| Birthday tomorrow | "Tomorrow is [Name]'s birthday! 🎂 Check their wishlist." |
| Birthday today | "🎉 TODAY IS [NAME]'S BIRTHDAY! 🎉" |
| RSVP | "[Name] is going to [Event]!" |

#### Personality Overview Dashboard

A visual dashboard showing the group's collective personality breakdown:

- **MBTI type distribution**: A bar chart or grid showing how many of each type exist
- **Enneagram distribution**: Pie or donut chart of the 9 types
- **Zodiac wheel**: A circular chart with each member's avatar placed on their sign
- **Love Language breakdown**: Bar chart of the group's dominant love languages
- **Compatibility matrix**: A heatmap grid (member × member) with a "compatibility score" calculated from MBTI + Enneagram + Zodiac. Purely fun, not scientific.
- **Fun group labels**: e.g., "The Others are 70% Introverts", "The most common sign is Scorpio", "Most of you are Type 4 Enneagram"

#### Member Directory

A card grid of all members. Each card shows:
- Avatar + display name + IGN
- Personality type badges (MBTI, Zodiac, Enneagram icons)
- Last active (e.g., "Active 2 days ago")
- Gaming platforms they own
- "View Profile" button

Click → full profile page

#### Group Stats

Fun read-only statistics panel:
- Total games played together: **X**
- Total movies watched together: **X**
- Oldest friendship in the group: **X years** (based on join date)
- Most active member (by activity count): **[Name]**
- Currently playing: **[Game]**
- Next event: **[Event] in X days**
- Personality curiosities: "X% of The Others are night owls (based on Chronotype — if added)"

---

## 8. Global UI/UX System

### Design Language

**Theme:** Dark Gamer Aesthetic

```
Background:       #0f0f1a  (deep navy-black)
Surface:          #1a1a2e  (card background)
Surface elevated: #16213e  (modal / elevated cards)
Border:           #2d2d4a  (subtle dividers)

Primary accent:   #7c3aed  (purple)
Secondary accent: #06b6d4  (cyan)
Success:          #10b981  (green)
Warning:          #f59e0b  (amber)
Error:            #ef4444  (red)
Gold:             #f59e0b  (achievements, birthdays)

Text primary:     #f1f5f9  (near white)
Text secondary:   #94a3b8  (slate-400)
Text muted:       #475569  (slate-600)
```

**Typography:**
- Headings: `Inter` or `Space Grotesk` — bold, clean
- Body: `Inter` — readable at all sizes
- Monospace (stats, codes): `JetBrains Mono`
- Font weights: 400 (body), 600 (subheadings), 700 (headings), 800 (hero text)

**Card Style:**
- Background: `#1a1a2e`
- Border: 1px `#2d2d4a`
- Border radius: `12px`
- Hover state: subtle purple glow (`box-shadow: 0 0 20px rgba(124, 58, 237, 0.3)`)
- Active/selected: cyan left border accent

**Buttons:**
- Primary: purple filled (`bg-purple-700 hover:bg-purple-600`)
- Secondary: transparent with border (`border-cyan-500 text-cyan-400`)
- Destructive: red (`bg-red-700`)
- Ghost: transparent, hover reveals background

### Navigation

**Desktop:** Fixed left sidebar with icons + labels
```
[Logo: THE OTHERS]
──────────────────
🏠  Group Corner       ← default landing
📅  Calendar
🎮  Gaming Library
🎬  Movie Library
🧠  Personality Corner
──────────────────
👤  My Profile
🔔  Notifications
⚙️  Settings
[Admin Panel] (admin only)
```

**Mobile / PWA:** Bottom navigation bar (5 tabs max)
```
🏠 Group | 📅 Calendar | 🎮 Gaming | 🎬 Movies | 🧠 Personality
```
With a "hamburger" menu for Profile, Settings, and Admin.

### Animations & Microinteractions

All animations use **Framer Motion** (free):

| Interaction | Animation |
|-------------|-----------|
| Page transitions | Fade + slide up (200ms) |
| Card hover | Subtle scale up (1.02) + glow |
| Quiz answer select | Color highlight + bounce |
| Quiz result reveal | Dramatic scale-in with glow |
| Achievement unlock | Pop-in + confetti burst |
| Birthday mode | Full confetti rain + color shift |
| Pile-on click | Ripple effect + count increment |
| Reaction click | Bounce + count increment |
| Notification bell | Wiggle animation when new notification |

### Responsive Breakpoints

| Breakpoint | Min Width | Layout |
|-----------|-----------|--------|
| Mobile | 0px | Single column, bottom nav |
| Tablet | 768px | Two column, side-friendly |
| Desktop | 1024px | Sidebar + main content |
| Wide | 1280px | Sidebar + main + optional right panel |

### PWA (Progressive Web App) Config

- `manifest.json` with app name, icons (512x512), theme color `#0f0f1a`
- Service worker for offline fallback page
- "Add to Home Screen" prompt for mobile users
- Splash screen with app logo on cold start

---

## 9. Notification System

Since budget is zero, notifications are **in-app only** (browser push is possible as a future upgrade).

### Notification Bell

- A bell icon in the sidebar/top bar
- Red badge with unread count
- Clicking opens a dropdown panel showing recent notifications
- Each notification: avatar, message, timestamp, link to relevant section
- "Mark all read" button

### Notification Triggers

| Event | Who Gets Notified |
|-------|------------------|
| New event created | All members |
| Availability poll opened | All members |
| Game session confirmed | All members who filled availability |
| Movie night scheduled | All members |
| Someone's birthday tomorrow | All members |
| Someone's birthday today | All members |
| New poll opened | All members |
| Poll closing in 1 hour | Members who haven't voted |
| New member joined | All members |
| Someone reacted to your activity | The original poster |
| Achievement unlocked | The member who unlocked it |
| Admin message / announcement | All members |

### Notification Storage

Notifications are stored in a `notifications` Supabase table, with columns:
- `user_id` (recipient)
- `type` (enum)
- `message`
- `link` (deep link to relevant section)
- `read` (boolean)
- `created_at`

---

## 10. Real-time Architecture

### Supabase Realtime

Supabase Realtime uses WebSockets to push database changes to connected clients. It is entirely free within the free tier.

**Channels to subscribe to:**

| Channel | Table | Events | Used By |
|---------|-------|--------|---------|
| `activity-feed` | `activity_feed` | INSERT | Group Corner feed |
| `poll-votes` | `poll_votes` | INSERT, UPDATE | Movie polls |
| `availability` | `session_availability` | INSERT, UPDATE | Availability grid |
| `notifications` | `notifications` | INSERT | Notification bell |
| `reactions` | `reactions` | INSERT, DELETE | Activity feed reactions |
| `birthdays` | `profiles` | UPDATE | Calendar (birthday changes) |

### Connection Strategy

- Subscribe to Realtime channels only when the relevant page is open (not globally)
- On page mount: subscribe. On page unmount: unsubscribe.
- Optimistic UI updates: apply changes locally before server confirmation, rollback on failure
- Reconnect logic: Supabase client handles this automatically

---

## 11. Gamification & Achievements

### Achievement System

Achievements are stored in a `achievements` table and `user_achievements` join table. They are unlocked server-side via Supabase database triggers or edge functions.

#### Achievement Categories & List

**Personality Achievements**

| Badge | Condition | Icon |
|-------|-----------|------|
| Self-Seeker | Completed 1 personality test | 🔍 |
| Know Thyself | Completed 5 personality tests | 🧠 |
| The Full Picture | Completed ALL personality tests | 🌌 |
| Star Child | Filled in birth time for Human Design | ⭐ |

**Movie Achievements**

| Badge | Condition | Icon |
|-------|-----------|------|
| First Watch | Logged first movie watched | 🎬 |
| Binge Watched | Watched 10 movies together | 📽️ |
| Cinephile | Watched 25 movies with the group | 🎭 |
| Director's Cut | Watched 50 movies with the group | 🏆 |
| Poll Starter | Created first movie poll | 🗳️ |
| The Decider | Won a ranked-choice poll | 🏅 |

**Gaming Achievements**

| Badge | Condition | Icon |
|-------|-----------|------|
| Game On | Added first game to library | 🎮 |
| Co-op Mode | Group played 5 games together | 👾 |
| Veteran | Group played 10 games together | ⚔️ |
| The Backlog | Added 5 games to queue | 📋 |
| Hype Train | Piled on 3 game wishlists | 🚂 |
| Session Leader | Scheduled 3 group gaming sessions | 📡 |

**Social / Engagement Achievements**

| Badge | Condition | Icon |
|-------|-----------|------|
| Welcome to The Others | Completed onboarding | 🚪 |
| Profile Complete | Filled all optional profile fields | 📛 |
| Party Animal | Attended 5 events | 🎉 |
| Streak: 4 Weeks | Active 4 weeks in a row | 🔥 |
| Streak: 3 Months | Active 12 weeks in a row | ⚡ |
| Poll Enthusiast | Voted in 10 polls | ✅ |
| Reactor | Left 20 reactions | 💜 |
| Birthday Rememberer | Reacted on 5 birthdays | 🎂 |

**Birthday Special**

| Badge | Condition | Icon |
|-------|-----------|------|
| It's My Day | Logged in on your own birthday | 🎈 |

### Achievement Display

- Displayed as glowing badges on the member's profile card
- Unlocked achievement is announced in the activity feed
- A subtle pop-up toast notification when unlocked: "Achievement Unlocked: [Name]!"
- The notification links to the Achievements section of their profile

---

## 12. Birthday Celebration System

### How It Works

**T-7 days before birthday:**
- Countdown appears on calendar: "[Name]'s birthday in 7 days"
- A subtle banner appears in the Group Corner for admins/mods to prepare

**T-1 day (24 hours before):**
- A notification is sent to ALL members: "Tomorrow is [Name]'s birthday! 🎂"
- Their profile card in the Member Directory gets a subtle gold glow

**The Birthday (all day):**

When ANY member opens the app on [Name]'s birthday:

1. **Confetti rain** — colorful confetti drops from the top of the screen for 3 seconds (Framer Motion + canvas-confetti library, free)
2. **Theme accent shift** — the birthday person's favorite color (from profile) replaces the cyan accent across the app for that session
3. **Birthday Banner** — a hero-size banner appears at the top of the Group Corner:
   ```
   ┌──────────────────────────────────────────────────────┐
   │  🎉  HAPPY BIRTHDAY, [NAME]! 🎉                      │
   │  [Large avatar with animated golden ring]             │
   │  "[Their bio or a fun birthday message]"             │
   │  ──────────────────────────────────────────────────  │
   │  Favorite Game: [game]  |  Favorite Movie: [movie]   │
   │  Favorite Food: [food]  |  Favorite Color: [color]   │
   │  ──────────────────────────────────────────────────  │
   │  [View Wishlist]  [Leave a Message]                  │
   └──────────────────────────────────────────────────────┘
   ```
4. **Birthday messages wall** — a temporary message board below the banner where members can type a birthday message. These disappear 7 days after the birthday.
5. **The birthday person** — when they log in on their own birthday, they see a personalized surprise screen before the main app loads: a full-screen animated birthday card with their name, signed by The Others, showing which friends are online now.

**"Leave a Message" Flow:**
- Any member clicks "Leave a Message"
- A modal opens with a text field (max 200 chars) + optional emoji reaction
- Message appears on the birthday wall in real-time
- The birthday person gets a notification for each message

**Admin Override:**
- Admin can manually add items to a member's wishlist (even without the member doing it)
- Admin can add favorites to any profile if a member hasn't filled them in

---

## 13. Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  real_name TEXT,
  ign TEXT,                          -- in-game name
  avatar_url TEXT,
  bio TEXT,
  birthday DATE,
  city TEXT,
  timezone TEXT,
  favorite_game_id UUID REFERENCES games(id),
  favorite_movie_id UUID REFERENCES movies(id),
  favorite_food TEXT,
  favorite_color TEXT,               -- hex code
  favorite_music TEXT,
  platforms TEXT[],                  -- ['pc','ps5','xbox','switch','mobile']
  role TEXT DEFAULT 'member',        -- 'member', 'moderator', 'super_admin'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now()
);

-- Invites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events (calendar)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,                -- 'birthday','game_night','movie_night','meetup','online','milestone','other'
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location_or_link TEXT,
  created_by UUID REFERENCES profiles(id),
  game_id UUID REFERENCES games(id),
  movie_id UUID REFERENCES movies(id),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,              -- RRULE string
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event RSVPs
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL,              -- 'going','maybe','not_going'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Availability Polls
CREATE TABLE availability_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  time_slot_minutes INT DEFAULT 60,
  is_closed BOOLEAN DEFAULT false,
  resulting_event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES availability_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  available_slots TIMESTAMPTZ[],     -- array of confirmed available datetime slots
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INT,                       -- null if manually entered
  title TEXT NOT NULL,
  cover_url TEXT,
  release_year INT,
  genres TEXT[],
  platforms TEXT[],
  is_multiplayer BOOLEAN DEFAULT false,
  summary TEXT,
  group_status TEXT DEFAULT 'queue', -- 'queue','playing','completed','dropped'
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_game_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  game_id UUID REFERENCES games(id),
  status TEXT NOT NULL,              -- 'playing_solo','completed','want_to_play','not_interested'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

CREATE TABLE game_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  game_id UUID REFERENCES games(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Movies
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INT,                       -- null if manually entered
  title TEXT NOT NULL,
  poster_url TEXT,
  release_year INT,
  genres TEXT[],
  runtime_minutes INT,
  overview TEXT,
  group_status TEXT DEFAULT 'queue', -- 'queue','watching','watched','dropped'
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_movie_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  movie_id UUID REFERENCES movies(id),
  status TEXT NOT NULL,              -- 'watched','watching','want_to_watch','not_interested'
  watched_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Movie Polls
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  closes_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT false,
  hide_until_closed BOOLEAN DEFAULT false,
  winning_movie_id UUID REFERENCES movies(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id),
  position INT                        -- display order
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rankings JSONB NOT NULL,            -- [{option_id, rank}, ...] for ranked choice
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Personality Tests
CREATE TABLE personality_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- 'mbti','enneagram','big_five', etc.
  name TEXT NOT NULL,
  description TEXT,
  question_count INT,
  is_auto_calculated BOOLEAN DEFAULT false
);

CREATE TABLE personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  test_slug TEXT NOT NULL,
  result_code TEXT NOT NULL,          -- e.g. 'INFJ', '4w5', 'Scorpio'
  result_label TEXT,                  -- e.g. 'The Advocate'
  result_data JSONB,                  -- raw scores or details
  is_shared BOOLEAN DEFAULT true,     -- false if they want it private
  taken_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  achievement_slug TEXT REFERENCES achievements(slug),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_slug)
);

-- Activity Feed
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,                          -- deep link
  metadata JSONB,                     -- {game_id, movie_id, etc.}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reactions
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, user_id, emoji)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Birthday Messages (ephemeral)
CREATE TABLE birthday_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_person_id UUID REFERENCES profiles(id),
  author_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Birthday Wishlists
CREATE TABLE birthday_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  item_name TEXT NOT NULL,
  item_url TEXT,
  note TEXT,
  is_fulfilled BOOLEAN DEFAULT false,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 14. API Integrations

### IGDB (Twitch Developer)

**Setup (free):**
1. Create account at [dev.twitch.tv](https://dev.twitch.tv)
2. Register an application → get `client_id` and `client_secret`
3. Authenticate via client credentials flow (server-side, never exposed to client)
4. Store access token in Supabase Edge Function environment variable

**Key endpoints used:**
- `POST /oauth2/token` — get access token
- `POST /v4/games` — search games by name, return cover, platforms, genres
- `POST /v4/covers` — get cover image URLs

**Caching strategy:** When a game is searched and added to The Others library, its IGDB data is saved to the `games` table. Subsequent views use the cached data, not fresh IGDB calls. This conserves the rate limit.

**Rate limit:** Not officially published, but effectively unlimited for small usage.

### TMDB (The Movie Database)

**Setup (free):**
1. Create account at [themoviedb.org](https://themoviedb.org)
2. Request an API key (free, approved instantly)
3. Store key in Vercel environment variable

**Key endpoints used:**
- `GET /search/movie` — search movies by title
- `GET /movie/{id}` — get full details, genres, runtime
- `GET /configuration` — get base image URL for posters

**Image URLs:** TMDB posters are served from their CDN for free. We simply store the image path and construct the full URL client-side.

**Rate limit:** 40 requests per 10 seconds. More than enough.

**Caching:** Same as IGDB — save to `movies` table on first fetch.

### No Other Paid APIs

All personality quizzes (MBTI, Enneagram, Big Five, Love Languages, Attachment Style, DISC) are implemented entirely in-app with hand-written question sets. The question data is a JSON file shipped with the app code. No external quiz API needed.

Human Design calculation uses a pre-computed lookup table based on I Ching hexagrams — this is complex but entirely calculable offline.

Zodiac, Chinese Zodiac, and Life Path number calculations are pure math done in TypeScript utility functions.

---

## 15. Implementation Roadmap

Since there is no deadline and all features should launch together, the roadmap is organized by **dependency order** — what must be built before what. This gives a logical path for a beginner to follow with Claude Code assistance.

### Phase 0: Foundation (Build This First)
- [ ] Create GitHub repository
- [ ] Initialize Next.js 14 project with TypeScript and Tailwind
- [ ] Set up Supabase project and get connection strings
- [ ] Configure Supabase Auth (Google + Discord providers)
- [ ] Set up Vercel deployment connected to GitHub
- [ ] Configure environment variables in Vercel
- [ ] Install shadcn/ui and set up the dark theme
- [ ] Build the basic app layout (sidebar, navigation, routing)

### Phase 1: Authentication & Profiles
- [ ] Login page (Google + Discord OAuth buttons)
- [ ] Invite link generation and validation
- [ ] Onboarding wizard (multi-step)
- [ ] Profile page (view + edit)
- [ ] Birthday wishlist page
- [ ] Member directory
- [ ] Admin panel (member management, invite management)
- [ ] Role/permission system with RLS policies

### Phase 2: Calendar
- [ ] Calendar component (month/week/list views)
- [ ] Event creation modal
- [ ] Birthday auto-population from profiles
- [ ] RSVP system
- [ ] Availability poll grid
- [ ] iCal export

### Phase 3: Gaming Library
- [ ] IGDB API integration (Next.js API route)
- [ ] Game search and add flow
- [ ] Game library views (by status, genre, platform)
- [ ] Group + personal status tracking
- [ ] Game wishlist + pile-on
- [ ] Session scheduler (links to calendar)

### Phase 4: Movie Library
- [ ] TMDB API integration
- [ ] Movie search and add flow
- [ ] Movie library views
- [ ] Group + personal watch tracking
- [ ] Ranked choice poll system
- [ ] Movie night scheduler

### Phase 5: Personality Corner
- [ ] Quiz engine (question renderer, answer collection, score calculator)
- [ ] MBTI quiz (30 questions)
- [ ] Enneagram quiz (27 questions)
- [ ] Big Five quiz (44 questions)
- [ ] Love Languages quiz (15 questions)
- [ ] Attachment Style quiz (20 questions)
- [ ] DISC quiz (28 questions)
- [ ] Auto-calculated: Zodiac, Chinese Zodiac, Life Path
- [ ] Auto-calculated: Human Design (complex — build last)
- [ ] Result reveal animation
- [ ] Personality card per member

### Phase 6: Group Corner
- [ ] Activity feed (display + real-time subscription)
- [ ] Reaction system
- [ ] Personality overview dashboard (charts)
- [ ] Group stats panel
- [ ] Notification bell + notification table

### Phase 7: Birthday System
- [ ] Birthday detection logic (daily check via Supabase scheduled function or cron)
- [ ] Birthday banner in Group Corner
- [ ] Confetti animation (canvas-confetti)
- [ ] Theme color override on birthday
- [ ] Birthday message wall
- [ ] Birthday surprise screen (birthday person's view)

### Phase 8: Gamification
- [ ] Achievements table and all badge definitions
- [ ] Achievement unlock triggers (DB triggers or server actions)
- [ ] Achievement display on profiles
- [ ] Achievement unlock toast + activity feed entry

### Phase 9: PWA & Polish
- [ ] PWA manifest and service worker
- [ ] Offline fallback page
- [ ] Performance optimization (image lazy loading, pagination)
- [ ] Mobile layout polish
- [ ] Accessibility audit (keyboard navigation, ARIA labels)
- [ ] Final dark theme polish (glow effects, animations)

---

## 16. Constraints & Limitations

### Supabase Free Tier Hard Limits

| Resource | Free Limit | Our Peak Estimate | Buffer |
|----------|-----------|------------------|--------|
| Database storage | 500MB | ~50MB | 90% free |
| File storage | 1GB | ~50MB | 95% free |
| Monthly Active Users | 50,000 | 20 users | 99.96% free |
| Realtime concurrent connections | 200 | 20 max | 90% free |
| Edge Function invocations | 500,000/month | ~1,000/month | 99.8% free |
| Database egress | 5GB/month | ~0.5GB | 90% free |

**Risk:** Supabase pauses projects that are **inactive for 7 days** on the free tier. Mitigation: set up a weekly ping cron job (via Vercel cron, free) to keep the project awake.

### Vercel Free Tier Limits

| Resource | Free Limit | Our Estimate |
|----------|-----------|-------------|
| Bandwidth | 100GB/month | ~5GB/month |
| Serverless function executions | 100,000/month | ~2,000/month |
| Build minutes | 6,000/month | ~60/month |

No risk of hitting Vercel limits at this scale.

### Design Constraints

- No file upload for cover art (use URL input instead) — saves storage
- Avatar uploads are compressed to max 200x200px before upload
- Personality quiz question data ships as static JSON in the app bundle (no database queries for questions)
- Birthday message wall is auto-deleted after 14 days (Supabase TTL or scheduled function)
- Activity feed displays the last 100 entries (no infinite scroll in MVP — reduces DB reads)

### Privacy Constraints

- City is the maximum location granularity stored (no addresses, no GPS)
- Real names are optional and never displayed publicly without user consent
- "Not interested" game/movie flags are private (not visible to other members or admin)
- Personality results have a "private" toggle per test
- No last names required anywhere in the system

---

## 17. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase project paused due to inactivity | Medium | High — app goes down | Set up a Vercel cron job to ping the DB weekly |
| IGDB token expiry (tokens expire every 60 days) | High | Medium — game search breaks | Store token expiry, auto-refresh on API route |
| Someone shares the invite link publicly | Low | Medium — strangers join | Admin can revoke + regenerate the invite token anytime |
| One member fills out another's data incorrectly | Low | Low | Admin can edit/delete any record |
| Activity feed spam | Low | Low | Rate limit: max 1 activity entry per user per event type per 10 minutes |
| Supabase storage fills up with avatars | Low | Medium | Compress avatars on upload; limit to 500KB per image |
| App feels overwhelming for passive members | Medium | Medium | Default landing is a clean activity feed, not a data-heavy dashboard |
| Personality quiz answers drift/become inaccurate | Low | Low | "Retake" button is always available |
| Human Design calculation complexity | High | Low — it's optional | Built last, clearly marked "coming soon" if not ready at launch |

---

## 18. Open Questions

These are decisions not yet made that will need to be resolved during implementation:

1. **Should past activity feed entries be editable or deletable by the original poster?** (Currently only admin/mods can delete)

2. **Should the Birthday Message Wall be anonymous or attributed?** (Current spec: attributed with avatar, but anonymous could be fun)

3. **Should members be able to hide their personality results from specific tests?** (Current spec: yes, per-test toggle)

4. **For the Enneagram, should we include wing notation (e.g., 4w5 vs just 4)?** (Adds complexity to the quiz scoring)

5. **Should the availability poll grid use 30-minute or 60-minute slots?** (60 min is simpler; 30 min is more precise)

6. **Should the Group Stats section be visible only to the admin or to all members?**

7. **Should there be a "group wishlist" for gift-giving occasions beyond birthdays (Christmas, group milestones)?**

8. **For the DISC quiz — should it use forced-choice (pick 1 of 4) or Likert scale (rate 1–5)?** (Forced-choice is more accurate; Likert is faster to take)

9. **Should the personality compatibility matrix show a score or just visual affinity symbols?** (Score = more informative; symbols = lower conflict if friends see low scores)

10. **Should there be a "quotes" or "inside jokes" section in the Group Corner?** (Not in scope yet — but easy to add as a Phase 10)

---

*This document is a living specification. As implementation progresses, sections should be updated to reflect actual decisions made. The admin (Zickiie) is the final decision-maker on all open questions.*

---

**Document Word Count:** ~6,500 words  
**Sections:** 18  
**Features Specified:** 120+  
**Estimated Free-Tier Monthly Cost:** $0.00
