# Feature Workflow: Report a Stray Animal

> **MVP Priority**: P0 · **Feature docs**: [README](./README.md) · **Status**: Blueprint
> **Sources**: [Product Blueprint §3 (Discovery)](../PawHaven-Product-Strategy-EN.md) · [Backend Architecture §Reporting](../PawHaven-Backend-Architecture.md) · [System Architecture Overview §6 (Events)](../PawHaven-System-Architecture-Overview.md) · [Figma Hero + Rescue Cases](../figma-design-spec.md)

## 1. Overview

The core action of PawHaven. A user spots a stray animal, walks through a **6-step report
wizard** (photos, location, animal info, condition, urgency, contact), submits it, and the
backend persists the report, creates a **rescue case**, and surfaces it publicly in the
**Rescue Cases** feed/map so volunteers can claim it.

## 2. Actors & Roles

| Role             | Action                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Guest            | Can start the wizard, but login is required before submit (or becomes "registered" at the end) |
| Registered user  | Submits the report; becomes `reporter` of the resulting case                                   |
| System (backend) | Persists report, assesses urgency, creates rescue case, notifies volunteers                    |

## 3. End-to-End Flow

**Click Report → Fill wizard → Submit → Backend saves → Case appears in Rescue Cases**

```mermaid
flowchart TD
    U[User clicks "Report a stray" CTA<br/>hero section or nav] --> W[Report wizard opens<br/>Report feature · 6 steps]
    W --> S1[1. Photos<br/>1–3 photos, compressed client-side<br/>uploaded via POST /api/files]
    S1 --> S2[2. Location<br/>GPS auto-locate + map picker]
    S2 --> S3[3. Animal info<br/>species · breed · color · age]
    S3 --> S4[4. Condition<br/>injured · sick · pregnant · scared ...]
    S4 --> S5[5. Urgency<br/>low · medium · high · critical]
    S5 --> S6[6. Contact & review<br/>name / phone + summary card]
    S6 --> SUB[Click Submit<br/>POST /api/reports<br/>photos · geo · animal · condition · urgency · contact]
    SUB --> GW[API Gateway]
    GW --> VAL{Reporting module validates<br/>Zod schema in @pawhaven/shared}
    VAL -- invalid --> S6
    VAL -- valid --> P1[Persist stray_reports]
    P1 --> P2[Compute urgency_assessments<br/>signs + user urgency]
    P2 --> EV[Publish StrayAnimalReported<br/>in-process event bus]
    EV --> R[Rescue module<br/>create rescue_cases · status PENDING]
    EV --> VLM[Volunteer module<br/>match online volunteers near location]
    EV --> N[Notification module<br/>tiered pushes to matched volunteers]
    EV --> C[Content module<br/>recommend knowledge articles]
    EV --> RESP[API returns report + case ID]
    RESP --> CONF[Confirmation screen<br/>"Report received" + case number]
    R --> FEED[Case visible in Rescue Cases<br/>homepage feed / map · status PENDING]
```

## 4. Frontend

- Feature module: `Report` — wizard component with 6 steps, step indicator, progress bar.
- Photo upload via `POST /api/files` (document-service), returns storage keys.
- Geolocation + map picker (species-agnostic location pin).
- Confirmation screen links to the new case detail page (see [03-rescue-case](./03-rescue-case.md)).
- Server-driven menu key: `report`.

## 5. Backend

- **Module**: Reporting (core-service) — controller → `submit-report.usecase.ts`.
- **Endpoints**:
  - `POST /api/reports` (create report + case)
  - `POST /api/files` (photo upload, document-service via gateway)
- **Events published**: `StrayAnimalReported`.
- Cross-module data access: strict module boundaries — Reporting never touches `rescue_cases` directly; it only emits the event.

## 6. Data Model

- `stray_reports` (Reporting): id, reporterId (nullable if guest), animal (species/breed/color/age),
  condition, location (GeoJSON point), photos[], contact, status, timestamps.
- `urgency_assessments` (Reporting): reportId, userUrgency, computedSeverity, reason.
- Downstream: `rescue_cases` (owned by Rescue), `notifications` (owned by Notification).

## 7. State Machine / Rules

- Report itself is immutable after submit (edits are a later phase).
- One active case per animal/report — duplicate detection dedupes by location radius + species.
- Guest submits: report saved with `guestToken`; user is invited to register to track it
  (MVP: login required at step 6).

## 8. Acceptance Criteria

- [ ] 6-step wizard flows correctly with validation per step.
- [ ] `POST /api/reports` persists report + assessment and returns case ID.
- [ ] `StrayAnimalReported` event fires; a `rescue_cases` row with status `PENDING` is created.
- [ ] Case appears in the homepage Rescue Cases list/map immediately after submit.
- [ ] Photo upload works and images render on the confirmation + case card.
- [ ] Location is stored as a valid GeoJSON point usable for geo queries.

## 9. Related Docs

- [Rescue Case Lifecycle](./03-rescue-case.md)
- [Notifications](./08-notifications.md)
- [Backend Architecture §Reporting](../PawHaven-Backend-Architecture.md)
- [System Architecture Overview §6 (Event Catalog)](../PawHaven-System-Architecture-Overview.md)
- [Product Blueprint §3 (Discovery)](../PawHaven-Product-Strategy-EN.md)
