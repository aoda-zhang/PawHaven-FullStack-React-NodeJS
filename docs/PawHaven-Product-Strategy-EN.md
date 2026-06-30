# PawHaven — Stray Animal Rescue Platform · Complete Product Blueprint

> **Version**: v1.0 | **Date**: 2025-07-01 | **Author**: Product Manager  
> **One-liner**: A collaborative platform connecting reporters, rescuers, and adopters — from first sighting to forever home.

---

## Table of Contents

1. [Product Positioning & User Personas](#1-product-positioning--user-personas)
2. [Module Overview](#2-module-overview)
3. [Module 1: Stray Animal Reporting](#3-module-1-stray-animal-reporting)
4. [Module 2: Rescue Progress Tracking](#4-module-2-rescue-progress-tracking)
5. [Module 3: Rescue Stories](#5-module-3-rescue-stories)
6. [Module 4: Rescue Knowledge Base](#6-module-4-rescue-knowledge-base)
7. [Module 5: Adoption Matching](#7-module-5-adoption-matching)
8. [Module 6: Volunteer Collaboration](#8-module-6-volunteer-collaboration)
9. [Module 7: Profile & Achievements](#9-module-7-profile--achievements)
10. [Value Flywheel & Product Roadmap](#10-value-flywheel--product-roadmap)

---

## 1. Product Positioning & User Personas

### 1.1 The Core Problem

> A stray animal goes through six stages from discovery to adoption: **Spot → Report → Rescue → Treat → Recover → Adopt**. Today, these stages are deeply fragmented — reporters don't know who to call, rescuers can't get timely information, and adopters can't find trustworthy channels. **This information gap causes low rescue efficiency. Many animals that could have been saved miss their critical rescue window.**

### 1.2 Product Mission

**Every stray life deserves to be seen, rescued, and treated with compassion.**

PawHaven is not "yet another pet community." It is a **collaboration network** — connecting reporters, rescuers (individual volunteers / shelters), veterinary clinics, and adopters on a single transparent workflow.

### 1.3 Four Core User Personas

| Persona | One-line Description | Core Need | Usage Frequency |
|---------|---------------------|-----------|-----------------|
| **Reporter** | A passerby or resident who spots a stray and wants to help but doesn't know how | "Who do I contact? How do I report this? What if the animal is injured?" | Low (sporadic events) |
| **Rescuer** | Individual volunteer or shelter staff who physically carries out rescues | "Are there new cases nearby? Who is handling them? Should I step in?" | High (daily work) |
| **Adopter** | Someone looking to adopt a rescued animal from a trusted source | "Is this animal healthy? What's its temperament? What's the adoption process?" | Medium (long decision cycle) |
| **Contributor** | Veterinarian or experienced rescuer who shares professional knowledge | "Are people reading my rescue guides? Can my experience help others?" | Low (content production) |

> **Key insight**: A single user may play multiple roles. Today you're a reporter, tomorrow you might be an adopter, and next week a rescuer. The product must support this **role fluidity**.

### 1.4 Competitive Differentiation

| Dimension | Traditional Adoption Platforms | Social Media Requests | **PawHaven** |
|-----------|-------------------------------|----------------------|-------------|
| Information Structure | Only shows adoptable animals | Fragmented posts | **Full pipeline structured (Report → Rescue → Adopt)** |
| Rescue Transparency | None | None | **7-stage status tracking, every step public** |
| Collaboration Mechanism | None | Spontaneous comments | **Volunteer claim + shelter coordination** |
| Knowledge Accumulation | None | Scattered posts | **Structured rescue knowledge base** |
| Trust Foundation | Platform endorsement | Personal reputation | **Public rescue records = natural trust chain** |

---

## 2. Module Overview

```
                     PawHaven Product Architecture

    ┌──────────────────────────────────────────────────┐
    │              🏠 Home (Information Hub)             │
    │    Latest Rescues · Featured Stories · Knowledge  │
    └────────┬───────────┬──────────┬──────────┬───────┘
             │           │          │          │
    ┌────────▼──┐ ┌──────▼───┐ ┌───▼────┐ ┌───▼──────────┐
    │ 🐾 Stray   │ │ 📋 Rescue│ │ 💝 Love│ │ 📚 Knowledge │
    │  Reporting │ │ Tracking │ │ Stories│ │    Base      │
    │  Report    │ │  Track   │ │        │ │              │
    └─────┬─────┘ └────┬────┘ └───┬────┘ └──────┬───────┘
          │            │          │              │
          └────────────┼──────────┼──────────────┘
                       │          │
              ┌────────▼──┐ ┌─────▼─────┐
              │ 🏠 Adoption│ │ 🤝 Volunteer│
              │  Matching  │ │ Collaboration│
              └───────────┘ └───────────┘
                       │          │
              ┌────────▼──────────▼──────────┐
              │   👤 Profile & Achievements   │
              └──────────────────────────────┘
```

### Inter-Module Data Flow

```
Reporter submits ──→ Creates rescue case ──→ Volunteer claims ──→ Status progression ──→ Ready for adoption
                         │                              │
                         ▼                              ▼
                   Knowledge Base ◄── referenced by ──── Rescue Stories (written post-adoption)
                                                           │
                                                           ▼
                                                    Adopter browses & matches
```

---

## 3. Module 1: Stray Animal Reporting

### 3.1 Module Purpose

**"Complete an effective stray animal report in under 3 minutes"** — enable anyone, even with zero rescue experience, to provide actionable information.

### 3.2 Core Business Flow

```
Spot a stray animal
    │
    ▼
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ ① Take/Upload│ ──→ │ ② Tag       │ ──→ │ ③ Basic Info │
│   Photos     │     │   Location  │     │ Type / Count │
└──────────────┘     └─────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ ⑥ Submitted  │ ←── │ ⑤ Urgency   │ ←── │ ④ Condition  │
│  + Next Steps│     │  Assessment │     │ Assessment   │
└──────────────┘     └─────────────┘     └──────────────┘
        │
        ▼
  System notifies nearby volunteers / shelters
        │
        ▼
  Case enters "Rescue Progress Tracking" module
```

### 3.3 Key Design Decisions

**Why 6 steps instead of a single-page form?**
- Reporters are usually stressed or in a hurry. Step-by-step guidance reduces cognitive load.
- Each step asks one thing: first take photos (most natural), then location (GPS auto-fetch), then describe.
- Non-critical fields can be skipped, but essential info (photos + location + animal type) is required.

**Urgency assessment logic**
- The system does NOT ask reporters to self-judge "does this need rescue?" (prone to error).
- Instead, it asks structured questions: Is the animal bleeding? Unable to move? In a dangerous location (middle of road / highway)?
- Any "yes" → automatically flagged as **Urgent** → prioritized notification push.

**Immediate feedback after submission**
- Not a cold "Submitted successfully." Instead, tell the user:
  1. "We've notified X nearby volunteers and Y shelters"
  2. "You can track this case's progress (click to view)"
  3. "Want to learn more about rescue? Read this guide"
- Goal: Make the reporter feel "I did something meaningful," not "I filled out a form."

### 3.4 Case Data Model (Core Fields)

| Field Group | Field | Required | Notes |
|-------------|-------|----------|-------|
| Media | Photos (1-5) | ✅ | First photo used as cover |
| Location | GPS coordinates + address text | ✅ | GPS auto-fetched, address editable |
| Basic | Animal type (Cat/Dog/Other) | ✅ | "Other" allows free text |
| Basic | Count | - | For litters of kittens/puppies |
| Condition | Appearance (coat color / size) | - | Helps identification |
| Condition | Urgency indicators (bleeding / immobile / dangerous spot) | ✅ | Auto-determines urgency level |
| Condition | Behavior (friendly / wary / aggressive) | - | Helps rescuer prepare |
| Contact | Reporter contact info | - | Optional, for follow-up |
| Contact | Willing to assist further? | - | Converts reporter into potential volunteer |

---

## 4. Module 2: Rescue Progress Tracking

### 4.1 Module Purpose

**"Every rescue has a beginning and an end"** — full-process transparent tracking from report to outcome. This is the foundation of platform trust.

### 4.2 Rescue State Machine (7 Stages)

```
   ┌─────────┐
   │ Pending │ ← Reporter submitted, awaiting response
   └────┬────┘
        │ Volunteer / Shelter claims the case
        ▼
   ┌─────────┐
   │InProgress│ ← Rescuer en route / actively rescuing
   └────┬────┘
        │ Animal safely relocated
        ▼
   ┌─────────┐
   │ Treated │ ← Initial medical care received (cleaning / bandaging / checkup)
   └────┬────┘
        │ Entering recovery period
        ▼
   ┌─────────┐
   │Recovering│ ← Recovering at shelter / foster home
   └────┬────┘
        │
   ┌────┴────────────┐
   │                 │
   ▼                 ▼
┌──────────┐   ┌──────────┐
│ Awaiting │   │  Failed  │ ← Did not survive / lost / unable to rescue
│ Adoption │   └──────────┘
└────┬─────┘
     │ Adoption successful
     ▼
┌──────────┐
│ Adopted  │
└──────────┘
```

### 4.3 Core Interactions per Status

| Status | Who Acts | Core Interaction |
|--------|---------|-----------------|
| **Pending** | System + Volunteers | System pushes notification to nearby volunteers; volunteers browse and "claim" cases; reporter can add info |
| **In Progress** | Rescuer | Rescuer posts updates (text + photos); records rescue method (trapping / net / direct carry) |
| **Treated** | Rescuer + Vet Clinic | Upload medical records (vaccines / deworming / surgery); record treatment costs (optional, supports donation) |
| **Recovering** | Shelter / Foster | Periodic recovery photos; behavioral assessment (temperament / habits / adoption suitability) |
| **Awaiting Adoption** | System + Adopters | Publish adoption listing; adopters browse and apply; shelter reviews applications |
| **Adopted** | Adopter + System | Adopter uploads "first day home" photo; case marked complete; invited to write a rescue story |
| **Failed** | Rescuer | Record cause (factual, no blame); option to show or hide details; emotional support reminder for rescuer |

### 4.4 Why the State Machine Is Central

- **Transparency builds trust**: Every status change has a timestamp and actor record. Adopters can see an animal's full journey from discovery to adoptability — this is the strongest trust signal.
- **Collaboration signaling**: Status tells all participants "who is needed now." Pending → needs volunteers. Recovering → needs patience. Awaiting Adoption → needs adopters.
- **Preventing "zombie cases"**: If a case stays in one status beyond expected time (e.g., Pending for 24+ hours), the system auto-escalates priority or notifies more volunteers.

### 4.5 Rescue Timeline

Every rescue case has a public **timeline view**, showing all status changes in reverse chronological order:

```
2025-06-15 14:30  🏠 Adopted      — Mr. Zhang adopted Little White, new home in Chaoyang District
2025-06-10 09:00  ⏳ Awaiting     — Little White fully vaccinated, now open for adoption
2025-06-03 16:00  💚 Recovering   — Wound healing well, eating normally
2025-06-01 11:00  💉 Treated      — Love Pet Clinic completed wound care and vaccines
2025-06-01 08:30  🔵 In Progress  — Volunteer Li Ming arrived on site, cat safely relocated
2025-06-01 07:15  ⚠️ Pending      — Ms. Chen spotted an injured white cat on Garden Road
```

---

## 5. Module 3: Rescue Stories

### 5.1 Module Purpose

**"Turn every successful rescue into a reason for more people to act"** — Rescue Stories are the platform's **emotional engine** that drives broader participation.

### 5.2 Core Business Flow

```
Rescue case marked "Adopted"
        │
        ▼
System auto-invites ──→ Rescuer / Adopter to write the story
        │
        ▼
┌────────────────────────────────────┐
│ Story Editor (structured + freeform)│
│                                    │
│ ① Title: "From Trash Bin to Couch  │
│    — Little Orange's 180 Days"     │
│ ② Before/After comparison photos  │
│ ③ Story body (rich text + inline   │
│    images)                         │
│ ④ Auto-embedded key stats          │
│    (rescue duration / people helped)│
│ ⑤ Tags (#CarCrashSurvivor #Orange  │
│    #TripodWarrior)                 │
└────────────────────────────────────┘
        │
        ▼
  Publish Review (anti-abuse)
        │
        ▼
┌────────────────────────────────────┐
│ Story Display                      │
│ · Homepage "Featured Stories"      │
│   carousel                         │
│ · Story listing page (filterable   │
│   by tag / animal type)            │
│ · Linked to original rescue case   │
│   (full traceability)              │
│ · Engagement: like / comment /     │
│   share                            │
└────────────────────────────────────┘
```

### 5.3 Why This Module Matters (Beyond a Simple List)

**Emotion drives action.** Data tells us:
- Rational information ("X animals awaiting adoption") drives ~20% of actions
- Emotional stories ("This cat was found in a trash bin — now it has a home") drives ~80% of actions

**Story → Action conversion chain**:
```
Read story → Moved → Browse adoptable animals → Submit adoption application
          → Moved → Learn rescue knowledge → Spot stray → Report it
          → Moved → Want to help → Register as volunteer
```

### 5.4 Story Content Strategy

| Story Type | Example | Target Emotion | Target Action |
|------------|---------|---------------|---------------|
| **Before/After** | From injured stray to a new life | Hope, warmth | Browse adoptions |
| **Rescue Documentary** | A midnight rescue — the full story | Admiration, resonance | Become a volunteer |
| **Adoption Diary** | 30 days after adoption | Trust, warmth | Submit adoption application |
| **Knowledge Sharing** | "5 mistakes I made on my first rescue" | Learning, empathy | Read knowledge base |
| **Community Story** | A neighborhood rallied to rescue a cat colony | Community spirit, participation | Report / Share |

---

## 6. Module 4: Rescue Knowledge Base

### 6.1 Module Purpose

**"Professional knowledge shouldn't stay locked in experienced rescuers' heads"** — systematically accumulate rescue knowledge to lower the barrier for ordinary people to participate.

### 6.2 Knowledge Taxonomy

```
Rescue Knowledge Base
├── 🚨 Emergency Situations
│   ├── What to do when you find an injured animal
│   ├── First aid for animals hit by vehicles
│   ├── Identifying and handling poisoning
│   └── How to safely approach an aggressive animal
│
├── 🐱 Feline Rescue
│   ├── Complete kitten rescue guide
│   ├── Adult stray cat TNR (Trap-Neuter-Return) guide
│   ├── Identifying common cat illnesses
│   └── How to assess if a cat is ready for adoption
│
├── 🐕 Canine Rescue
│   ├── Stray dog rescue safety guide
│   ├── Identifying & isolating distemper / parvovirus
│   └── Transporting and housing large dogs
│
├── 📋 Rescue Process
│   ├── Complete checklist for your first rescue
│   ├── How to contact shelters and animal welfare orgs
│   ├── Rescue supply checklist (what to keep on hand)
│   └── Relevant laws and regulations
│
├── 🏠 Adoption & Placement
│   ├── Adoption screening criteria reference
│   ├── New pet at home: the first 7 days
│   └── Introducing a new pet to a multi-pet household
│
└── 💡 Experience Sharing
    ├── Stories and insights from veteran rescuers
    ├── Regional rescue resource directory (user-contributed)
    └── Common myths and pitfalls to avoid
```

### 6.3 Core Business Flow

```
┌────────────────┐
│ Contributor     │ ← Certified vet / experienced rescuer / platform editor
│ writes article  │
│ (structured     │
│  editor)        │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Review Process  │ ← Content review (accuracy + safety)
│ (expert review) │   Medical advice MUST include disclaimer:
│                 │   "For reference only. Consult a veterinarian."
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Publish         │
│ · Category index│
│ · Full-text     │
│   search        │
│ · Linked rescue │ ← "About TNR — see this case study..."
│   cases         │
│ · Related       │
│   articles      │
│ · Downloadable  │ ← Offline reading, useful in the field
│   PDF           │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Feedback Loop   │
│ · "Was this     │ ← Collect feedback, optimize content
│   helpful?"     │
│ · Comments &    │
│   discussion    │
│ · Contribute    │ ← Users can add experience in comments
│   additions     │
└────────────────┘
```

### 6.4 Key Design Decisions

**Why review is mandatory?**
Rescue knowledge involves animal lives. Wrong advice (e.g., "give the cat human medicine") can be fatal. Every article must:
- Be reviewed by at least one certified vet or experienced rescuer
- Include disclaimer on all medical advice
- Label whether content is "experiential knowledge" or "veterinary professional knowledge"

**Knowledge Base ↔ Rescue Flow integration**
- When a user reports a stray, auto-recommend relevant articles based on "animal type" and "urgency indicators"
- Example: reporting "injured cat" → recommend "What to do with an injured animal" + "Kitten/Adult cat rescue guide"
- When a volunteer claims a case, recommend "Rescue checklist" and "How to contact nearby shelters"

---

## 7. Module 5: Adoption Matching

### 7.1 Module Purpose

**"Not a listing — a matchmaking service"** — match animals to adopters based on living conditions and preferences to increase adoption success rates and reduce return rates.

### 7.2 Core Business Flow

```
┌──────────────────────────────────────┐
│          Adopter Side                │
│                                      │
│  Browse adoptable animals            │
│  ← linked to full rescue case history│
│       │                              │
│       ▼                              │
│  View animal detail                  │
│  · Full rescue timeline (transparency│
│    = trust)                          │
│  · Recovery + medical records        │
│  · Behavioral assessment (temperament│
│    / habits / special needs)         │
│  · Rescuer / shelter info            │
│       │                              │
│       ▼                              │
│  Submit adoption application         │
│  · Basic info (housing / pet         │
│    experience / household members)   │
│  · Adoption intent (why this animal?)│
│  · Upload home photos (optional)     │
│       │                              │
└───────┼──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│          Shelter Side                │
│                                      │
│  Receive application → Review → Chat │
│  → Interview / Home visit            │
│       │                              │
│       ▼                              │
│  Decision: Approve / Reject (with    │
│  reason) / Pending                   │
│       │                              │
│       ▼                              │
│  Approved → Sign adoption agreement  │
│           → Transfer animal          │
│           → Case marked "Adopted"    │
│           → Invite to write story    │
└──────────────────────────────────────┘
```

### 7.3 Matching Algorithm (Lightweight)

Not a complex recommendation engine — **condition-based filtering + weighted ranking**:

| Match Dimension | Weight | Description |
|-----------------|--------|-------------|
| Adopter preference (type / age / size) | ⭐⭐⭐⭐⭐ | Hard match |
| Geographic proximity | ⭐⭐⭐⭐ | Closer = easier follow-up visits |
| Adopter experience match | ⭐⭐⭐ | Beginners → gentle-tempered animals; Experienced → special-needs animals |
| Animal wait time | ⭐⭐ | Longer wait = slightly higher weight (not primary factor) |
| Living condition match | ⭐⭐⭐⭐ | Apartment ≠ large dog; families with children need stable-temperament animals |

### 7.4 Adoption Return Prevention

> Returning an adopted animal causes secondary trauma. Preventing returns is more important than handling them.

| Stage | Prevention Measure |
|-------|-------------------|
| **Application** | Require adoption motivation and housing details; educational prompt ("Adoption is a 15-year commitment") |
| **Review** | Shelter thoroughly communicates with adopter; discloses special needs and potential issues |
| **Transfer** | Provide "New Pet Home Guide" (linked to knowledge base); sign adoption agreement |
| **Post-Adoption** | 7-day / 30-day / 90-day follow-up reminders; adopter can keep a "new home diary" on the platform |

---

## 8. Module 6: Volunteer Collaboration

### 8.1 Module Purpose

**"Let people who want to help know exactly how to help"** — volunteers aren't "sign up and done." They get a clear capability profile and a task-matching system.

### 8.2 Volunteer Capability Model

```
Volunteer Profile
├── Basic Info
│   ├── City / District (CRITICAL — determines notification radius)
│   ├── Availability (weekday evenings / weekends / anytime)
│   └── Transportation (walking / bike / car → determines response radius)
│
├── Rescue Capabilities
│   ├── Experience level (Beginner / Experienced / Veteran / Professional Vet)
│   ├── Specialty (Cats / Dogs / Small animals)
│   ├── Task types (On-site rescue / Transport / Temporary foster / Trap assistance)
│   └── Verification status (platform identity verified or not)
│
├── Rescue Statistics
│   ├── Total rescues participated
│   ├── Successful rescues
│   ├── Response speed (average claim time)
│   └── Ratings (from reporters / shelters)
│
└── Preferences
    ├── Receive emergency notifications?
    ├── Notification radius (5km / 10km / city-wide)
    └── Willing to foster temporarily?
```

### 8.3 Core Business Flow

```
Reporter submits case (with location)
        │
        ▼
System matches ──→ Filter: within radius + capability match + online volunteers
        │
        ▼
Push notification ──→ "An injured cat needs help 2.3km from you"
        │
        ▼
Volunteer views case → Decides: "Claim" or "Pass"
        │
        ▼
After claiming ──→ Case status → In Progress
               │  → Other volunteers see "1 person handling"
               │  → Can request to "Assist" (if multiple people needed)
               │
               ▼
Rescue complete ──→ Update case status
                → Volunteer earns rescue points / achievements
                → Rescue record added to personal stats
```

### 8.4 Volunteer Motivation System

Not gamification — **meaning-driven + light achievement**:

| Motivation | Implementation |
|-----------|---------------|
| **Rescue Record** | Profile shows "You've helped X animals" |
| **Gratitude System** | Reporters and adopters can send thank-you notes to volunteers |
| **Skill Growth** | Progress from "Beginner" to "Veteran" reflecting real experience |
| **Community Recognition** | Monthly featured volunteer showcase (with consent) |
| **Priority Access** | High-activity volunteers see new cases earlier |

---

## 9. Module 7: Profile & Achievements

### 9.1 Module Purpose

**"Every act of kindness is recorded"** — the Profile is the user's identity and footprint on the platform.

### 9.2 Unified Identity

Since a user can simultaneously be a reporter, volunteer, and adopter, the profile aggregates data across all roles:

```
Profile
├── 📊 My Data
│   ├── Cases I reported (X total, Y successfully rescued)
│   ├── Rescues I participated in (X volunteer actions)
│   ├── Animals I adopted
│   └── Stories I wrote (X stories, Y total likes)
│
├── 🏅 My Achievements (lightweight badges)
│   ├── "First Report" / "First Rescue" / "First Adoption"
│   ├── "Rescue Pro" (10+ rescues participated)
│   ├── "Storyteller" (5+ rescue stories written)
│   ├── "Knowledge Contributor" (X knowledge base articles)
│   └── "Community Hero" (thanked X times)
│
├── 📝 My Activity
│   ├── Progress of cases I'm following
│   ├── New updates on cases I reported
│   └── Knowledge / stories I bookmarked
│
└── ⚙️ Settings
    ├── Notification preferences
    ├── Volunteer status (Online / Away / Long-term unavailable)
    └── Privacy settings (which info is public)
```

### 9.3 Why an Achievement System?

Not for "gamification." It exists because:
1. **Identity anchoring**: "I'm a volunteer who has helped 15 animals" — this is a real identity, not a virtual level
2. **New user guidance**: Achievements guide users to discover platform features ("You haven't reported a stray animal yet!")
3. **Trust credential**: Adopters seeing a rescuer with the "Rescue Pro" badge → more trust

---

## 10. Value Flywheel & Product Roadmap

### 10.1 Platform Value Flywheel

```
                     ┌──────────────┐
                     │  More Animals │
                     │    Rescued    │
                     └──────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ Reporters  │   │ Rescuers   │   │ Adopters   │
   │ (Info In)  │   │ (Execute)  │   │ (Forever   │
   │            │   │            │   │  Home)     │
   └──────┬─────┘   └──────┬─────┘   └──────┬─────┘
          │                 │                 │
          │    ┌────────────┼────────────┐    │
          │    │            │            │    │
          ▼    ▼            ▼            ▼    ▼
   ┌────────────────────────────────────────────┐
   │           Platform Value Accumulation       │
   │                                            │
   │  · Knowledge Base (ever-improving)          │
   │  · Rescue Stories (emotional assets)        │
   │  · Volunteer Network (collaboration infra)  │
   │  · Rescue Data (can inform animal policy)   │
   │  · Trust Relationships (Rescuer ↔ Adopter) │
   └────────────────────┬───────────────────────┘
                        │
                        ▼
               ┌──────────────┐
               │  More People  │
               │ Participate   │
               │  More Animals │
               │   Are Seen    │
               └──────────────┘
```

### 10.2 Product Roadmap

| Phase | Timeline | Deliverables | Goal |
|-------|----------|-------------|------|
| **Phase 1: MVP** | Months 1-3 | Stray reporting + Rescue tracking + Basic profile | Prove the "Report → Rescue" loop, validate core value |
| **Phase 2: Activate Network** | Months 3-6 | Volunteer collaboration + Push notifications + Knowledge base | Activate volunteer network, ensure cases get responses |
| **Phase 3: Emotional Engine** | Months 6-9 | Rescue stories + Adoption matching + Achievements | Drive broader participation, generate word-of-mouth |
| **Phase 4: Ecosystem** | Months 9-12 | Shelter admin dashboard + Data analytics + Open API | Make shelters core platform users, build two-sided network effects |

### 10.3 MVP Minimum Viable Feature Set

> Core principle: **Get one rescue to flow end-to-end first, then expand.**

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Stray reporting (photos + GPS + urgency indicators) | P0 | Entry point — no reports, no platform |
| Rescue case browsing (list + detail + timeline) | P0 | Volunteers need to see animals needing help |
| 7-stage status progression | P0 | The "spine" of rescue — no status, no collaboration |
| Basic user registration / login | P0 | Identity |
| Profile (my reports / my rescues) | P1 | MVP can be rough, but basic display needed |
| Volunteer case claiming | P1 | Core collaboration action |
| Case status updates (text + photos) | P1 | Rescuer posts progress |
| Nearby case push notifications | P2 | Manual browsing works first, notifications later |
| Rescue stories | P3 | Needs successful cases before stories can be written |
| Adoption matching | P3 | Needs "Awaiting Adoption" animal inventory |
| Knowledge base | P2 | Start with 5-10 core articles |

---

## Appendix: Key Design Principles

1. **Mobile-first**: Reporters typically use phones to report. Volunteers check cases on phones outdoors. All core flows must be mobile-friendly.

2. **Offline-tolerant**: Rescue scenarios may have unstable connectivity. Report forms should support offline drafts with GPS caching.

3. **Safety-first**: Never expose reporter's exact GPS (show approximate area only). Never expose volunteer's phone number (use in-app messaging). Animal location auto-fuzzed after rescue completion.

4. **Information authenticity**: Reports must include photos. Volunteer identity verification is optional (lower barrier to entry). Adopters must submit real information.

5. **Emotional safety**: "Failed" status displays with respect for the animal and rescuer. No blaming rescuers in comments ("Why didn't you go sooner?"). Provide emotional support resources for rescuers.

---

> **Next step**: Based on this product blueprint, proceed to UI/UX design phase — produce page designs and interaction prototypes for each module.
