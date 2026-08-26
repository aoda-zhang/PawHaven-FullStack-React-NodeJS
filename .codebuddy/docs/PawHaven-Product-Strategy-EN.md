# PawHaven — Stray Animal Rescue Platform · Complete Product Blueprint

> **Version**: v2.0 | **Date**: 2025-07-03 | **Author**: Product Manager  
> **One-liner**: A collaborative platform connecting reporters, rescuers, and adopters — from first sighting to forever home.

---

## Table of Contents

1. [The Animal's Journey: Complete Lifecycle Overview](#1-the-animals-journey-complete-lifecycle-overview)
2. [User Model: Who Can Do What](#2-user-model-who-can-do-what)
3. [Stage 0: Discovery — How an Animal Becomes Visible](#3-stage-0-discovery--how-an-animal-becomes-visible)
4. [Stage 1: Pending — Waiting for a Rescuer](#4-stage-1-pending--waiting-for-a-rescuer)
5. [Stage 2: In Progress — Rescue Underway](#5-stage-2-in-progress--rescue-underway)
6. [Stage 3: Treated — Medical Care Received](#6-stage-3-treated--medical-care-received)
7. [Stage 4: Recovering — Rehabilitation Period](#7-stage-4-recovering--rehabilitation-period)
8. [Stage 5: Awaiting Adoption — Ready for a Forever Home](#8-stage-5-awaiting-adoption--ready-for-a-forever-home)
9. [Stage 6: Adopted — Mission Complete](#9-stage-6-adopted--mission-complete)
10. [Endings Alternative: Failed, Duplicate, Cancelled](#10-endings-alternative-failed-duplicate-cancelled)
11. [Supporting Systems](#11-supporting-systems)
12. [Value Flywheel & Roadmap](#12-value-flywheel--roadmap)

---

## 1. The Animal's Journey: Complete Lifecycle Overview

### 1.1 The Core Problem

> A stray animal goes through many stages from discovery to a potential forever home. Today, these stages are deeply fragmented — the person who spots the animal doesn't know who to tell, people who could rescue it never hear about it, and those who might adopt it have no way to trust the animal's history. **Every broken link in this chain means an animal that could have been saved is left behind.**

### 1.2 The Full Lifecycle (8 Stages)

```
  ┌──────────────┐
  │  STAGE 0     │  Someone spots a stray animal.
  │  DISCOVERY   │  A passerby. A resident. Anyone.
  └──────┬───────┘
         │ They open PawHaven and submit a report
         │ (photos + GPS + urgency indicator)
         ▼
  ┌──────────────┐
  │  STAGE 1     │  The case is now PUBLIC.
  │  PENDING     │  Visible on the homepage map/list.
  │  (待响应)     │  System notifies nearby volunteers.
  └──────┬───────┘                            ↑
         │ A volunteer "claims" the case       │ If no one claims in 24h:
         │ (publicly declares intent to help)  │ system escalates — wider
         ▼                                     │ radius, more notifications.
  ┌──────────────┐
  │  STAGE 2     │  Rescuer is en route or
  │  IN PROGRESS │  actively rescuing.
  │  (救助中)     │  Posts updates — photos, notes.
  └──────┬───────┘
         │ Animal is safely relocated
         │ (trapped / caught / transported)
         ▼
  ┌──────────────┐
  │  STAGE 3     │  Initial medical care done.
  │  TREATED     │  Cleaning, bandaging, vaccines,
  │  (已治疗)     │  basic checkup at a clinic.
  └──────┬───────┘
         │ Entering recovery period
         ▼
  ┌──────────────┐
  │  STAGE 4     │  Resting at shelter or foster
  │  RECOVERING  │  home. Periodic progress photos.
  │  (康复中)     │  Behavioral assessment begins.
  └──────┬───────┘
         │ Recovery complete, animal is healthy
         │
    ┌────┴─────────────────┐
    │                      │
    ▼                      ▼
  ┌──────────────┐   ┌──────────────┐
  │  STAGE 5     │   │  STAGE X     │  Did not survive.
  │  AWAITING    │   │  FAILED      │  Could not be rescued.
  │  ADOPTION    │   │  (已结束)     │  Escaped / lost.
  │  (待领养)     │   └──────────────┘
  └──────┬───────┘
         │ An adopter applies and is approved
         ▼
  ┌──────────────┐
  │  STAGE 6     │  Animal has a forever home.
  │  ADOPTED     │  Adopter posts "first day home".
  │  (已领养)     │  Case archived with full history.
  └──────────────┘
```

### 1.3 Who Does What at Each Stage (At a Glance)

| Stage                    | Reporter                                 | Volunteer (Rescuer)                | Shelter Staff                   | Adopter                            | Guest / Casual User       |
| ------------------------ | ---------------------------------------- | ---------------------------------- | ------------------------------- | ---------------------------------- | ------------------------- |
| **0. Discovery**         | **Submits report**                       | —                                  | —                               | —                                  | Can browse knowledge base |
| **1. Pending**           | Tracks progress, can add info            | **Claims case**, asks questions    | Browses cases, can claim        | —                                  | Sees case on map/list     |
| **2. In Progress**       | Watches updates                          | **Executes rescue, posts updates** | Can offer transport / support   | —                                  | Views rescue progress     |
| **3. Treated**           | Watches medical updates                  | **Uploads medical records**        | Provides vet contacts           | —                                  | Views medical timeline    |
| **4. Recovering**        | Follows recovery                         | Posts progress photos              | **Approves adoption readiness** | —                                  | Views recovery photos     |
| **5. Awaiting Adoption** | Sees case is adoptable                   | Helps screen applicants            | **Reviews applications**        | **Browses & applies**              | Views adoption listing    |
| **6. Adopted**           | Receives "mission complete" notification | Invited to write story             | Case archived                   | **Posts home photo, writes story** | Reads rescue story        |

> **Bold** = primary actor for that stage. A regular user who reports becomes the Reporter role. An unregistered passerby is a Guest.

---

## 2. User Model: Who Can Do What

### 2.1 Three Access Tiers (NOT Three User Types)

PaHaven does NOT ask users to "pick a role" at registration. Everyone registers as a single **User**. What they can do depends on their **access tier** — which is progressive:

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        GUEST                                 │
  │  (Not logged in. Arrived via link, search, or homepage.)     │
  │                                                             │
  │  CAN:                                                        │
  │  • Browse the homepage map/list of pending rescue cases      │
  │  • View any rescue case detail + full timeline               │
  │  • Browse adoption listings                                  │
  │  • Read knowledge base articles                              │
  │  • Read rescue stories                                       │
  │                                                             │
  │  CANNOT:                                                     │
  │  • Submit a report (must register first)                     │
  │  • Claim a case                                              │
  │  • Comment, follow, or interact                              │
  │  • Apply to adopt                                            │
  └────────────┬────────────────────────────────────────────────┘
               │ Register (email or social login)
               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                     REGISTERED USER                          │
  │  (Logged in. Has a profile. Default tier.)                   │
  │                                                             │
  │  Everything Guest CAN, PLUS:                                  │
  │                                                             │
  │  • Submit a stray animal report → becomes the REPORTER       │
  │  • Follow any rescue case → get notified of status changes   │
  │  • Comment on rescue cases + stories                         │
  │  • "Like" stories and cases                                  │
  │  • Bookmark knowledge articles                               │
  │  • Apply to adopt an animal (submits application to shelter) │
  │  • View personal profile (my reports, my follows, my apps)   │
  │                                                             │
  │  CANNOT:                                                     │
  │  • Claim a rescue case (must opt into volunteer tier first)  │
  │  • Update case status                                       │
  └────────────┬────────────────────────────────────────────────┘
               │ Opt-in: Complete volunteer profile
               │ (set location, capabilities, availability)
               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                     VOLUNTEER (Registered + Opt-in)          │
  │  (Has completed volunteer onboarding. Capability profile.)   │
  │                                                             │
  │  Everything Registered User CAN, PLUS:                        │
  │                                                             │
  │  • Claim pending rescue cases                                │
  │  • Update case status (only for cases they claimed)          │
  │  • Receive push notifications for nearby new cases           │
  │  • Post rescue progress updates (photos + text)              │
  │  • Upload medical records                                    │
  │  • Request assistance from other volunteers                  │
  │  • Mark a case as ready for adoption                         │
  │  • Earn volunteer achievements and stats                     │
  │  • Be thanked by reporters and adopters                      │
  └─────────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Principle: Role Is Fluid, Actions Are Permission-Based

A single user account can do ALL of the above **simultaneously**:

- Alice is a **Registered User** who reports a stray cat (now she's a Reporter for that case)
- Alice also opted into **Volunteer** tier, so she can claim rescue cases
- Alice later applies to **adopt** a dog — now she's also an Adopter

The system tracks these **per-case** or **action-based** roles. There is no profile setting that says "I am only a Reporter." The user is simply a User; what they can do depends on their tier.

### 2.4 What Each Tier Sees on the Homepage

| Area                                    | Guest                     | Registered User            | Volunteer                                |
| --------------------------------------- | ------------------------- | -------------------------- | ---------------------------------------- |
| **Map/List of pending cases**           | ✅ Full view              | ✅ Full view               | ✅ Full view + distance + urgency badges |
| **"Report a stray" CTA**                | ✅ Button → prompts login | ✅ Active button           | ✅ Active button                         |
| **Nearby pending cases (personalized)** | ❌ No personalization     | ✅ Based on saved city     | ✅ Based on GPS + volunteer radius pref  |
| **"Cases you're following" section**    | ❌                        | ✅ Shows followed cases    | ✅ Shows followed cases                  |
| **"Cases you claimed" quick access**    | ❌                        | ❌                         | ✅ Quick action panel                    |
| **New case push notifications**         | ❌                        | ❌ (opt-in via follow)     | ✅ Automatic for nearby urgent cases     |
| **Adoptable animals**                   | ✅ Public listings        | ✅ Public + "apply" button | ✅ Same as registered                    |
| **Knowledge base**                      | ✅ Full access            | ✅ Full + bookmark         | ✅ Full + bookmark                       |
| **Stories**                             | ✅ Full access            | ✅ Full + like/comment     | ✅ Same as registered                    |

---

## 3. Stage 0: Discovery — How an Animal Becomes Visible

### 3.1 The Moment of Discovery

```
                 A person spots a stray animal.
                 Could be anyone.

       ┌─────────┴────────────┐
       │                      │
       ▼                      ▼
  They know PawHaven?    They don't know PawHaven?
       │                      │
       ▼                      ▼
  Open app → Report       They search "how to help stray
       │                  animal near me" → Find PawHaven
       │                  via search / social share →
       │                  Land on homepage as Guest →
       │                  See existing cases nearby →
       │                  "Oh, I can report too!" →
       │                  Register → Report
       │                      │
       └──────────┬───────────┘
                  ▼
         THE REPORT WIZARD
         (6 steps, mobile-first)
```

### 3.2 The Report Wizard (6 Steps)

This is the single most critical form in the entire product. It must work for someone stressed, in a hurry, possibly outdoors, with one hand on a phone.

```
Step 1: PHOTOS        Step 2: LOCATION      Step 3: ANIMAL TYPE
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Take or upload   │   │ GPS auto-fetched │   │ ○ Cat           │
│ 1-5 photos.      │   │ Address shown    │   │ ○ Dog           │
│ First = cover.   │   │ (editable).      │   │ ○ Other: [____] │
│                  │   │ Pin on map       │   │                 │
│ [Tap to capture] │   │ draggable.       │   │ Count: [1]      │
│                  │   │                  │   │                 │
│ Required ✅       │   │ Required ✅       │   │ Required ✅      │
└─────────────────┘   └─────────────────┘   └─────────────────┘

Step 4: CONDITION    Step 5: URGENCY       Step 6: CONFIRM
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Appearance:      │   │ Structured Q's:  │   │ ┌─────────────┐ │
│ • Coat color     │   │                  │   │ │ Case summary │ │
│ • Approx size    │   │ □ Bleeding?      │   │ │ Photo · Type │ │
│                  │   │ □ Cannot move?   │   │ │ · Location   │ │
│ Behavior:        │   │ □ In danger zone │   │ │ · Urgency    │ │
│ ○ Friendly       │   │   (road/highway) │   │ └─────────────┘ │
│ ○ Wary/avoidant  │   │ □ Breathing      │   │                 │
│ ○ Aggressive     │   │   difficulty?    │   │ Your contact?   │
│                  │   │                  │   │ (optional)      │
│ Optional          │   │ Any YES → Urgent │   │                 │
└─────────────────┘   └─────────────────┘   │ [Submit Report] │
                                             └─────────────────┘
```

### 3.3 What Happens IMMEDIATELY After Submission

The reporter sees a **confirmation screen** — not a cold "Success" toast:

```
  ┌──────────────────────────────────────────────┐
  │                                              │
  │         🙏 Thank you for reporting!           │
  │                                              │
  │  We've notified X volunteers and Y shelters   │
  │  near Garden Road, Chaoyang District.         │
  │                                              │
  │  ┌──────────────────────────────────────┐    │
  │  │  Case #PAW-0421 — "Injured White Cat" │    │
  │  │  Status: 🟡 Pending — Awaiting rescue │    │
  │  │  Reported: Just now                   │    │
  │  └──────────────────────────────────────┘    │
  │                                              │
  │  [📱 Track this case's progress]             │
  │                                              │
  │  While you wait:                              │
  │  • 📖 Read: "What to do when you find an     │
  │    injured animal" (from our knowledge base)  │
  │  • 🔔 We'll notify you when someone claims   │
  │    this case                                  │
  │                                              │
  │  Want to help more? [Become a Volunteer →]   │
  │                                              │
  └──────────────────────────────────────────────┘
```

### 3.4 Behind the Scenes: The System's Actions

Simultaneously, the system:

1. **Creates the case** in the database with status = `PENDING`
2. **Geocodes the location** → determines city, district, and approximate radius area
3. **Matches volunteers** within the configurable radius who:
   - Have "Online" volunteer status
   - Can handle this animal type (Cat / Dog / Small animal)
   - Are within their own notification radius setting
4. **Sends push notifications** to matched volunteers:
   - Normal urgency: "A stray cat needs help 2.1km from you"
   - **Urgent**: `"🚨 URGENT: Injured cat needs immediate help 2.1km from you"` (with critical alert sound)
5. **Pushes the case to the public homepage** map and list — visible to EVERYONE
6. **Starts an escalation timer**: if not claimed within 24 hours (or 2 hours for urgent), escalate

---

## 4. Stage 1: Pending — Waiting for a Rescuer

### 4.1 What EVERYONE Sees

The case appears on the **public homepage** in two views:

**Map View:**

```
  ┌─────────────────────────────────────────┐
  │       🗺️ Map (leaflet / Mapbox)          │
  │                                          │
  │            📍 Pine Rd                     │
  │         🐱 (urgent)                       │
  │                                          │
  │   📍 Oak Ave         📍 5th St            │
  │   🐕                🐱                    │
  │                                          │
  │  [List View] [Map View]  Filters: ▾      │
  └─────────────────────────────────────────┘
```

- Blue dot = normal pending case
- Red pulsing dot = urgent pending case
- Tapping a dot shows a mini-card with photo + animal type + distance

**List View:**

```
  ┌──────────────────────────────────────────┐
  │  Pending Rescue Cases                   │
  │  ┌──────────────────────────────────────┐│
  │  │ [photo] 🐱 Injured White Cat         ││
  │  │        Garden Road · 2.1km away      ││
  │  │        🟡 Pending · 5 min ago        ││
  │  │        Urgency: High 🚨              ││
  │  └──────────────────────────────────────┘│
  │  ┌──────────────────────────────────────┐│
  │  │ [photo] 🐕 Brown Dog                 ││
  │  │        Oak Avenue · 3.5km away       ││
  │  │        🟡 Pending · 23 min ago       ││
  │  │        Urgency: Normal               ││
  │  └──────────────────────────────────────┘│
  └──────────────────────────────────────────┘
```

### 4.2 What the REPORTER Sees

After submitting, the reporter sees this case in two places:

1. **Post-submit confirmation screen** (shown above)
2. **Profile → "My Reports"** — a dashboard of all cases they've reported

```
  ┌──────────────────────────────────────────┐
  │  MY REPORTS                              │
  │                                          │
  │  Case #PAW-0421                          │
  │  🐱 Injured White Cat                    │
  │  Garden Road · Reported 2 hours ago      │
  │  Status: 🟡 PENDING                      │
  │  "We've notified 12 volunteers near you"  │
  │                                          │
  │  [View Full Timeline]                    │
  │  [Add More Information]                  │
  └──────────────────────────────────────────┘
```

The reporter can **add more information** at any point while the case is pending — more photos, better description, correction of location.

### 4.3 What a VOLUNTEER Sees

A volunteer receives a **push notification** (if within radius):

> `"A stray cat needs help near Garden Road (2.1km away)"`  
> or  
> `"🚨 URGENT: Injured cat — Garden Road (2.1km away)"`

Tapping it opens the case detail page, which for a volunteer includes:

```
  ┌──────────────────────────────────────────┐
  │  🐱 Injured White Cat                     │
  │  Garden Road, Chaoyang District           │
  │  🟡 Pending · Reported 5 min ago          │
  │  Urgency: 🚨 HIGH                         │
  │                                          │
  │  [Photo 1]  [Photo 2]  [Photo 3]         │
  │                                          │
  │  Description:                             │
  │  "White cat with injured right hind       │
  │   leg. Hiding under a parked car near     │
  │   the bus stop. Seems wary of people."    │
  │                                          │
  │  Animal: Cat · Adult · White             │
  │  Behavior: Wary/Avoidant                 │
  │  Location: 📍 Garden Road (approx)        │
  │                                          │
  │  Reported by: Anonymous Reporter          │
  │                                          │
  │  ┌────────────────────────────────────┐   │
  │  │   CURRENTLY 0 VOLUNTEERS CLAIMED   │   │
  │  │                                    │   │
  │  │   [🙋 I'LL RESCUE THIS ANIMAL]     │   │
  │  │   (Claim this case)                │   │
  │  │                                    │   │
  │  │   Or: [Ask a Question]  [Share]    │   │
  │  └────────────────────────────────────┘   │
  └──────────────────────────────────────────┘
```

### 4.4 The Claiming Mechanism (Core Collaboration Action)

When a volunteer clicks **"I'll Rescue This Animal"**:

1. **Confirmation dialog:**

   ```
   ┌─────────────────────────────────┐
   │  Claim "Injured White Cat"?     │
   │                                 │
   │  By claiming, you are committing│
   │  to:                            │
   │  • Go to the location           │
   │  • Attempt to rescue the animal │
   │  • Post status updates          │
   │  • Transfer to vet/shelter if   │
   │    needed                       │
   │                                 │
   │  [Yes, I'm on it]  [Cancel]    │
   └─────────────────────────────────┘
   ```

2. **Case status changes**: `PENDING` → `IN_PROGRESS`

3. **Everyone sees the update:**
   - The claimer's name appears on the case: "Rescued by: Li Ming (Volunteer, 12 rescues)"
   - Other volunteers see: "1 volunteer handling this case" — they can still offer to **Assist**
   - The reporter receives a notification: "Li Ming has claimed your case and is on the way!"

4. **The claimed case moves to a different section** on the homepage:
   - Map: dot changes from yellow to blue
   - List: moves from "Pending" to "In Progress" tab

### 4.5 What if NO ONE Claims the Case?

**Escalation timeline:**

| Time Since Report | Normal Urgency                    | Urgent                                     |
| ----------------- | --------------------------------- | ------------------------------------------ |
| 0 min             | Push to nearby volunteers         | Push to nearby volunteers (critical alert) |
| 30 min            | —                                 | Push to wider radius                       |
| 2 hours           | Push to wider radius              | Push to ALL volunteers in city             |
| 24 hours          | Push to ALL volunteers in city    | Auto-escalate to partner shelters          |
| 48 hours          | Auto-escalate to partner shelters | Platform admin reviews manually            |

At any point, the reporter can also **share the case link** on social media to crowdsource help.

---

## 5. Stage 2: In Progress — Rescue Underway

### 5.1 Who Can Update Status

**Only the volunteer who claimed the case** (or a shelter staff member who claimed it) can advance the status.

An assistant volunteer can post comments and upload photos, but cannot change the status.

### 5.2 What the Rescuer DOES

After claiming, the rescuer is expected to:

1. **Arrive at the location** (travel time varies)
2. **Post an arrival update**: "I'm at Garden Road. Can see the cat under the third parked car. Preparing the carrier."
3. **Execute the rescue** — this may involve:
   - Direct capture (animal is friendly, can be picked up)
   - Trapping (requires trap cage, may take hours/days)
   - Coordinating with property management (animal in a locked area)
   - Calling for backup (animal is aggressive or large) → "Request Assistance" button
4. **Post rescue complete update**: "Cat secured in carrier. Transporting to Love Pet Clinic."
5. **Advance status** to `TREATED`

### 5.3 What the REPORTER Sees During Rescue

The reporter follows the rescue via:

1. **Push notifications** for each update:
   - "Li Ming has arrived at the location"
   - "Li Ming posted a new photo"
   - "The cat has been safely secured!"

2. **The case timeline** (accessible from their profile):

```
  ┌──────────────────────────────────────────┐
  │  Rescue Timeline: Injured White Cat       │
  │                                          │
  │  TODAY, 14:30                            │
  │  🔵 IN PROGRESS                          │
  │  Cat secured in carrier. Transporting     │
  │  to Love Pet Clinic.                      │
  │  📸 [photo of cat in carrier]            │
  │  — Li Ming, Volunteer                    │
  │                                          │
  │  TODAY, 14:00                            │
  │  🔵 IN PROGRESS                          │
  │  I'm at Garden Road. Located the cat      │
  │  under the third parked car near the      │
  │  bus stop. Preparing carrier.             │
  │  — Li Ming, Volunteer                    │
  │                                          │
  │  TODAY, 08:15                            │
  │  🟡 PENDING                              │
  │  Case reported by you.                    │
  └──────────────────────────────────────────┘
```

### 5.4 What GUESTS and REGISTERED USERS See

Anyone browsing the homepage can click into the case and see the same timeline — minus private contact details. This transparency is the **foundation of trust** for the platform.

---

## 6. Stage 3: Treated — Medical Care Received

### 6.1 Transition Trigger

The rescuer (or shelter staff) advances the case to `TREATED` and uploads:

```
  ┌──────────────────────────────────────────┐
  │  Update: Medical Treatment               │
  │                                          │
  │  Facility: Love Pet Clinic, Chaoyang     │
  │                                          │
  │  Treatment received:                      │
  │  ☑ Wound cleaning and bandaging          │
  │  ☑ Rabies vaccine                        │
  │  ☑ Deworming                             │
  │  ☑ Blood test                            │
  │  ☐ Surgery: ___________                  │
  │                                          │
  │  Medical notes:                           │
  │  "Right hind leg has a 3cm laceration.   │
  │   No fracture confirmed by X-ray.         │
  │   Expected recovery: 2-3 weeks."          │
  │                                          │
  │  Cost (optional, for transparency):       │
  │  ¥680 — [View Breakdown]                 │
  │                                          │
  │  📸 Upload medical documents / receipts   │
  │  [Upload Photos]                         │
  │                                          │
  │  [Save & Advance to Treated]             │
  └──────────────────────────────────────────┘
```

### 6.2 What Changes for Viewers

- The case now has **verified medical records** — this establishes the animal's health baseline
- Future adopters can see exactly what medical care was received
- The health record is immutable and timestamped (prevents later disputes about health status)

---

## 7. Stage 4: Recovering — Rehabilitation Period

### 7.1 Transition Trigger

After initial treatment, the animal is placed in a recovery environment:

- **Shelter/facility** — managed by a partner shelter
- **Foster home** — managed by a volunteer foster

The rescuer or shelter staff advances to `RECOVERING` and specifies:

```
  Recovery Location:
  ○ Happy Paws Shelter (partner)
  ○ Foster Home: [Volunteer Name]
  ○ Other: ___________

  Expected recovery duration: [2 weeks]
```

### 7.2 Ongoing Recovery Updates

The caretaker (shelter staff or foster volunteer) posts periodic updates:

```
  ┌──────────────────────────────────────────┐
  │  Recovery Update — Day 5                  │
  │                                          │
  │  "Wound is healing well. Stitches removed │
  │   today. White Cat is eating normally and  │
  │   has started to purr when petted. She's   │
  │   much calmer now."                        │
  │                                          │
  │  📸 [Photo of cat resting]               │
  │                                          │
  │  Weight: 3.2kg (up from 2.8kg)            │
  └──────────────────────────────────────────┘
```

### 7.3 Behavioral Assessment (Critical for Adoption)

When the caretaker deems the animal physically recovered, they complete a **behavioral assessment**:

| Trait                     | Assessment                                      | Notes |
| ------------------------- | ----------------------------------------------- | ----- |
| **Temperament**           | Gentle / Playful / Independent / Timid          |       |
| **Human interaction**     | Seeks attention / Tolerates / Avoids            |       |
| **Other animals**         | Friendly / Indifferent / Reactive / Not tested  |       |
| **Children**              | Suitable / Caution / Not tested                 |       |
| **Leash trained** (dogs)  | Yes / In progress / No                          |       |
| **Litter trained** (cats) | Yes / In progress / No                          |       |
| **Special needs**         | None / Medication / Diet / Mobility aid / Other |       |
| **Adoption suitability**  | ✅ Ready for adoption / ⚠️ Needs more time      |       |

This becomes the **adoption profile** and is visible to adopters.

### 7.4 Advancing to Adoption

When:

- Physical recovery is confirmed
- Behavioral assessment is complete
- Vaccinations are up to date
- The animal has been spayed/neutered (or a commitment is in place)

→ The caretaker advances the case to `AWAITING_ADOPTION`.

---

## 8. Stage 5: Awaiting Adoption — Ready for a Forever Home

### 8.1 The Adoption Listing

Once marked `AWAITING_ADOPTION`, the case automatically appears on the **Adoption page**:

```
  ┌──────────────────────────────────────────┐
  │  🏠 ADOPTABLE ANIMALS                    │
  │                                          │
  │  ┌──────────────────────────────────────┐│
  │  │ [photo] 🐱 White Cat                  ││
  │  │        Adult · Female · 1 year       ││
  │  │        Happy Paws Shelter · Chaoyang  ││
  │  │        ⏳ Waiting 3 days              ││
  │  │        Tags: Gentle, Litter-trained   ││
  │  └──────────────────────────────────────┘│
  │                                          │
  │  ┌──────────────────────────────────────┐│
  │  │ [photo] 🐕 Brown Dog                  ││
  │  │        Adult · Male · 2 years        ││
  │  │        Sunshine Shelter · Haidian    ││
  │  │        ⏳ Waiting 12 days             ││
  │  │        Tags: Playful, Leash-trained   ││
  │  └──────────────────────────────────────┘│
  └──────────────────────────────────────────┘
```

### 8.2 What an ADOPTER Sees (Full Detail)

```
  ┌──────────────────────────────────────────┐
  │  🐱 White Cat — Available for Adoption    │
  │  Happy Paws Shelter · Chaoyang District   │
  │                                          │
  │  [Photo Gallery: 5 recovery photos]       │
  │                                          │
  │  ─── QUICK INFO ───                      │
  │  Age: ~1 year     Sex: Female (spayed)   │
  │  Breed: Domestic Shorthair               │
  │  Weight: 3.5kg                            │
  │                                          │
  │  ─── TEMPERAMENT ───                     │
  │  Gentle, seeks human attention.           │
  │  Good with other cats. Litter-trained.    │
  │  Suitable for families with children.     │
  │                                          │
  │  ─── MEDICAL RECORDS ───                 │
  │  ✅ Rabies vaccine (June 1)               │
  │  ✅ Deworming (June 1)                    │
  │  ✅ Spayed (June 15)                      │
  │  ✅ Blood test — negative for FIV/FeLV    │
  │                                          │
  │  ─── FULL RESCUE HISTORY ───             │
  │  ▶ See complete timeline (6 stages)       │
  │    From discovery on Garden Road to       │
  │    recovery at Happy Paws Shelter.        │
  │                                          │
  │  ─── RESCUER INFO ───                   │
  │  Rescued by: Li Ming (🏅 12 rescues)     │
  │  Sheltered by: Happy Paws Shelter         │
  │                                          │
  │  [💌 Apply to Adopt]                     │
  │  [🔔 Follow This Animal]                 │
  └──────────────────────────────────────────┘
```

### 8.3 The Adoption Application

When the adopter clicks **"Apply to Adopt"**:

```
  ┌──────────────────────────────────────────┐
  │  Adoption Application: White Cat          │
  │                                          │
  │  ─── ABOUT YOU ───                       │
  │  Name: [________]  Phone: [________]     │
  │                                          │
  │  Housing type:                           │
  │  ○ Own house  ○ Rented apartment         │
  │  ○ Own apartment  ○ Other               │
  │                                          │
  │  Do you have a fenced yard/balcony?       │
  │  ○ Yes, secured  ○ Yes, not secured     │
  │  ○ No                                    │
  │                                          │
  │  Household members:                      │
  │  □ Adults only  □ Children under 12      │
  │  □ Children 12+  □ Elderly               │
  │                                          │
  │  ─── PET EXPERIENCE ───                  │
  │  Have you owned pets before?              │
  │  ○ Yes, currently have pets              │
  │  ○ Yes, had before but not now           │
  │  ○ No, first time                         │
  │                                          │
  │  If currently have pets, please describe: │
  │  [___________________________________]    │
  │                                          │
  │  ─── YOUR MOTIVATION ───                 │
  │  Why do you want to adopt White Cat?      │
  │  [___________________________________]    │
  │                                          │
  │  ─── HOME ENVIRONMENT ───                │
  │  Upload photos of your home (optional):   │
  │  [Upload Photos (1-3)]                   │
  │                                          │
  │  ⚠️ Adoption is a 15+ year commitment.    │
  │  Please consider carefully before         │
  │  applying.                                │
  │                                          │
  │  [Submit Application]                    │
  └──────────────────────────────────────────┘
```

### 8.4 The Shelter Review Process

The shelter (or managing volunteer) receives the application and follows a review workflow:

```
  Application received → Review → Interview/Chat (in-app messaging)
       │
       ├── APPROVE → Schedule transfer → Adopter signs agreement
       │                                     │
       │                                     ▼
       │                              Case → ADOPTED
       │
       ├── PENDING → Request more info from adopter
       │
       └── REJECT → Provide reason (with kindness)
                     Adopter can apply for other animals
```

---

## 9. Stage 6: Adopted — Mission Complete

### 9.1 The Adoption Handoff

When the shelter approves the adoption:

1. **Adoption agreement** is signed (digital or physical)
2. **Animal transfer** happens — the adopter picks up the animal
3. The shelter marks the case `ADOPTED`

### 9.2 What Happens After Adoption

**Immediately:**

- The reporter receives a notification: "The White Cat you reported on Garden Road has been adopted! 🏠"
- The rescuer(s) receive: "White Cat has found a forever home. Thank you for your rescue!"
- All followers of the case receive the adoption notification

**The Adopter can:**

- Post a "First Day Home" photo — this is added to the timeline
- Keep a "New Home Diary" (optional) — periodic updates visible to the shelter

**The System triggers:**

- Auto-invitation to write a **Rescue Story** for the rescuer and/or adopter
- Case archived as a completed rescue — full timeline preserved permanently

### 9.3 The Rescue Story (Post-Adoption Content)

```
  Case marked ADOPTED
       │
       ▼
  ┌──────────────────────────────────────────┐
  │  SYSTEM INVITATION                        │
  │  "White Cat's rescue journey is complete! │
  │   Would you share her story?"             │
  │                                          │
  │  Sent to: Rescuer & Adopter               │
  └──────────────┬───────────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────────┐
  │  STORY EDITOR (structured + freeform)     │
  │                                          │
  │  Title: [_____________________________]   │
  │                                          │
  │  Before/After comparison:                 │
  │  [Before photo] → [After photo]          │
  │  (auto-suggested from rescue timeline)    │
  │                                          │
  │  Story body (rich text):                  │
  │  [___________________________________]    │
  │                                          │
  │  Auto-embedded stats:                     │
  │  • Rescue duration: 32 days               │
  │  • 1 reporter + 2 volunteers helped       │
  │  • Medical costs: ¥680                    │
  │                                          │
  │  Tags: [ #InjuredRescue #WhiteCat        │
  │          #HappyEnding #Adopted ]         │
  └──────────────────────────────────────────┘
```

These stories appear on the homepage **Featured Stories** carousel and feed the platform's emotional engine.

---

## 10. Endings: Alternative — Failed, Duplicate, Cancelled

Not every rescue ends in adoption. The system must handle non-happy endings with dignity.

### 10.1 Failed

The case can be marked `FAILED` by the rescuer at any point after claiming if:

- The animal did not survive (found deceased, or passed during treatment)
- The animal could not be found at the reported location
- The animal escaped during rescue or recovery
- Rescue was impossible (dangerous location, aggressive behavior beyond safe handling)

**What happens:**

- The rescuer records the reason (factual, no blame language)
- They can choose to show or hide detailed reason from public view
- The case timeline freezes at the last active stage
- A respectful status message is shown: "This rescue could not be completed. We're grateful to everyone who tried."
- The rescuer receives an emotional support message with links to resources
- Supportive comments are allowed; blaming comments are moderated

### 10.2 Duplicate

If multiple people report the same animal, a volunteer or admin can merge cases:

- The newer case is marked `DUPLICATE` and links to the primary case
- The duplicate reporter is notified: "Thank you for reporting! Someone else also spotted this animal — you can follow the rescue here [link]."

### 10.3 False Report / Cancelled

If a case is determined to be invalid (false information, animal is actually owned, etc.), an admin can mark it `CANCELLED` with a reason visible internally.

---

## 11. Supporting Systems

### 11.1 Rescue Knowledge Base

**Purpose:** Professionally curated educational content that lowers the barrier for everyone to participate.

**Where it appears:**

- **Post-report recommendation**: After someone submits a report, show relevant guides ("What to do when you find an injured cat")
- **Volunteer toolkit**: When a volunteer claims a case, show "Rescue checklist" and "First aid basics"
- **Adopter education**: When someone applies to adopt, show "New pet at home: the first 7 days"
- **Standalone browsing**: Searchable, categorized knowledge base accessible from homepage

**Content categories:**

```
├── 🚨 Emergency Situations (what to do immediately)
├── 🐱 Feline Rescue (kitten care, TNR, common illnesses)
├── 🐕 Canine Rescue (safety, distemper/parvo, large dog handling)
├── 📋 Rescue Process (checklists, legal info, organization contacts)
├── 🏠 Adoption & Placement (screening, introduction to home)
└── 💡 Experience Sharing (veteran rescuer insights)
```

**Quality control:** All medical advice must be reviewed by a certified vet. Articles are labeled "Professional Medical Knowledge" vs "Community Experience."

### 11.2 Volunteer Network & Notification Engine

**Matching algorithm (simplified):**

1. New case created → get GPS coordinates
2. Query volunteers where:
   - `volunteer.status = ONLINE`
   - `distance(case_location, volunteer_location) <= volunteer.notification_radius`
   - `volunteer.animal_specialty IN (case.animal_type, 'ALL')`
3. Rank by: proximity + response history + experience level
4. Send tiered push notifications (urgent cases get critical alerts)
5. First-come-first-claim — first volunteer to click "Claim" gets the case

**Escalation rules:**

| Case Urgency | First Notification | Escalation 1    | Escalation 2           |
| ------------ | ------------------ | --------------- | ---------------------- |
| Normal       | 5km radius         | 15km at 24h     | City-wide at 48h       |
| Urgent       | 10km radius        | City-wide at 2h | Partner shelters at 6h |

### 11.3 Profile & Achievements

Every user's profile aggregates all their contributions:

```
PROFILE: Alice
├── 📊 MY DATA
│   ├── Cases I reported: 3 (2 successfully rescued)
│   ├── Rescues I participated: 8
│   ├── Animals I adopted: 1
│   └── Stories I wrote: 2 (48 likes)
│
├── 🏅 ACHIEVEMENTS (lightweight badges)
│   ├── 🔰 "First Report"
│   ├── 🔰 "First Rescue"
│   ├── ⭐ "Rescue Pro" (10+ rescue participations)
│   ├── 📝 "Storyteller" (3+ rescue stories)
│   └── 💚 "Community Hero" (received 5+ thank-you notes)
│
├── 📝 ACTIVITY FEED
│   ├── Cases I'm following
│   ├── My cases' status updates
│   └── Bookmarked knowledge
│
└── ⚙️ SETTINGS
    ├── Notification preferences
    ├── Volunteer settings (Online / Away / Off, radius, animal types)
    └── Privacy (which data is public)
```

Achievements serve three purposes:

1. **Identity anchoring** — "I've helped 8 animals" is a real identity
2. **New user onboarding** — achievements guide users to try platform features
3. **Trust credential** — adopters trust rescuers with the "Rescue Pro" badge

---

## 12. Value Flywheel & Roadmap

### 12.1 Platform Value Flywheel

```
        More reports → More animals visible
              │
              ▼
    More animals rescued (volunteer network)
              │
              ▼
    More animals ready for adoption
              │
      ┌───────┴───────┐
      ▼               ▼
  More adoptions   More rescue stories
      │               │
      └───────┬───────┘
              ▼
    Emotional impact → Word of mouth → New users
              │
              ▼
    More reporters + volunteers + adopters
              │
              ▼
        (Back to start — flywheel spins)
```

### 12.2 MVP Scope (Phase 1)

| Feature                               | Priority | Why                                             |
| ------------------------------------- | -------- | ----------------------------------------------- |
| Guest browsing (homepage map + list)  | P0       | Without visibility, no volunteers can help      |
| Stray reporting wizard (6 steps)      | P0       | Entry point — no reports, no platform           |
| Case detail page + timeline           | P0       | Rescue transparency = platform trust            |
| 7-stage status machine                | P0       | The backbone — defines the entire workflow      |
| Volunteer opt-in + capability profile | P0       | Must exist for claiming to work                 |
| Volunteer case claiming               | P0       | Core collaboration action                       |
| Case status updates by rescuer        | P0       | Progress must be shareable                      |
| Basic user registration/login         | P0       | Need identity for reporting + claiming          |
| Push notifications for volunteers     | P0       | Without notifications, volunteers won't respond |
| Reporter tracking (My Reports)        | P1       | Essential for reporter satisfaction             |
| Follow a case                         | P1       | Drives return visits                            |
| Profile page (basic)                  | P1       | Shows user activity summary                     |

### 12.3 Phase 2-4

| Phase                         | Timeline   | Focus                                                                                |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| **Phase 2: Activate Network** | Month 3-6  | Knowledge base, volunteer achievements, wider notification logic, shelter onboarding |
| **Phase 3: Emotional Engine** | Month 6-9  | Rescue stories, adoption matching with applications, full achievement system         |
| **Phase 4: Ecosystem**        | Month 9-12 | Shelter admin dashboard, analytics, open API, regional resource directory            |

---

## Appendix: Key Design Principles

1. **Mobile-first**: Reporters and volunteers operate on phones, often outdoors. Every core flow must work on mobile first.

2. **Progressive tier access**: Guest → Registered → Volunteer. No one is locked out of information; actions require appropriate permissions.

3. **Transparency builds trust**: Every status change is timestamped and attributed. The full rescue timeline is public. This is what makes adopters trust the animal's history.

4. **Safety-first**: Never expose exact GPS (show approximate area). Never expose phone numbers (in-app messaging only). Animal location is fuzzed after rescue completion.

5. **Emotional safety**: Failed cases are treated with respect. No blame language is allowed in comments toward reporters or rescuers. Emotional support resources are available for rescuers.

6. **Information authenticity**: Reports require photos. Volunteer verification is optional (lower barrier). Medical records are immutable.

7. **One user, many roles**: A single account can report, rescue, and adopt. The system tracks actions per case, not persona per user.

---

> **Next step**: Based on this product blueprint, proceed to UI/UX design phase — produce page designs and interaction prototypes for each stage of the animal lifecycle.
