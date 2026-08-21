# Feature Workflow: Volunteer Network & Case Claiming

> **MVP Priority**: P0 · **Feature docs**: [README](./README.md) · **Status**: Blueprint
> **Sources**: [Product Blueprint §10 (Volunteer Network)](../PawHaven-Product-Strategy-EN.md) · [Backend Architecture §Volunteer](../PawHaven-Backend-Architecture.md) · [System Architecture Overview §6 (Events)](../PawHaven-System-Architecture-Overview.md)

## 1. Overview

Registered users can **opt in as volunteers**, define their capabilities (species they can
handle), radius, and availability. When a report comes in, the Volunteer module **matches**
nearby capable volunteers, notifies them (see [08-notifications](./08-notifications.md)),
and one of them **claims** the case — first-come-first-claimed with an escalation SLA.

## 2. Actors & Roles

| Role            | Action                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Registered user | Opts in, sets capabilities/radius/availability status                             |
| Volunteer       | Receives case alerts, claims cases, gets assigned as `assignee`                   |
| System          | Matches volunteers by capability + distance + availability, escalates stale cases |

## 3. End-to-End Flow

**Opt-in → Set capabilities → Report arrives → Match → Notify → Claim → Assigned**

```mermaid
flowchart TD
    A[User enables volunteer mode<br/>profile settings] --> B[POST /api/volunteers/profile]
    B --> C[Set capabilities · radius · status<br/>species · km · ONLINE / AWAY / OFF]
    C --> D[Volunteer profile saved<br/>geo-indexed]
    EV[StrayAnimalReported or<br/>RescueCaseReported event] --> M[Volunteer matcher runs]
    D --> M
    M --> F1[Filter<br/>status = ONLINE · capability matches species<br/>distance ≤ radius]
    F1 --> F2[Rank<br/>proximity → response history → experience]
    F2 --> N[Notification module<br/>tiered pushes to top N<br/>critical = wider radius + faster SLA]
    N --> V[Volunteers receive alert<br/>with case link]
    V --> CK{First volunteer clicks Claim?}
    CK -- yes --> CL[POST /api/volunteers/claims<br/>with caseId]
    CL --> EV2[VolunteerClaimed event]
    EV2 --> RESCUE[Rescue module<br/>case → IN_PROGRESS · assignee set]
    RESCUE --> OTHERS[Other volunteers see<br/>"already claimed"]
    CK -- no claim within SLA<br/>2h critical / 24h normal --> ESC[Escalation<br/>expand radius · alert shelter staff<br/>see 08-notifications]
    RESCUE --> STATS[Volunteer stats update<br/>after case completion<br/>responses · claims · completed rescues]
```

## 4. Frontend

- Feature modules: `Volunteer` (profile + dashboard) + `Profile` (settings).
- Volunteer dashboard: online/away toggle, case alert inbox, my claims, stats.
- Server-driven menu keys: `volunteer.dashboard`, `volunteer.profile`.

## 5. Backend

- **Module**: Volunteer (core-service).
- **Endpoints**:
  - `POST /api/volunteers/profile` / `PATCH /api/volunteers/profile` (opt-in + capabilities + radius + status)
  - `GET /api/volunteers/me` (own profile + stats)
  - `POST /api/volunteers/claims` (claim a case)
  - `GET /api/volunteers/claims` (my claims)
- **Events published**: `VolunteerClaimed`.
- **Events consumed**: `StrayAnimalReported`, `RescueCaseReported` (trigger matching),
  `RescueCaseCompleted` (update stats).

## 6. Data Model

- `volunteer_profiles` (Volunteer): userId (unique), capabilities[], radiusKm, status,
  stats (responses/claims/completed), timestamps. Geo-indexed on `location`.
- `case_claims` (Volunteer): caseId, volunteerId, status (PENDING/ACCEPTED/DECLINED),
  claimedAt, releasedAt.

## 7. State Machine / Rules

- Claim is **first-come-first-served**; one active claim per case (others auto-declined).
- Volunteer availability: `ONLINE` = eligible for matching; `AWAY` = no alerts;
  `OFF` = fully inactive.
- Matching only considers volunteers whose radius covers the case location.
- A claim can be released (reassign) if the volunteer is unresponsive within SLA.

## 8. Acceptance Criteria

- [ ] Opt-in flow persists capabilities, radius, and availability status.
- [ ] Matcher returns only ONLINE + capable + in-radius volunteers, ranked by proximity.
- [ ] Report event triggers notifications to matched volunteers (see Notifications).
- [ ] First claim succeeds; subsequent claims are declined with "already claimed".
- [ ] Claimed case transitions to `IN_PROGRESS` with the volunteer assigned.
- [ ] Unclaimed cases escalate per SLA (radius + shelter alert).
- [ ] Volunteer stats update after case completion.

## 9. Related Docs

- [Rescue Case Lifecycle](./03-rescue-case.md)
- [Notifications](./08-notifications.md)
- [Profile & Achievements](./09-profile-achievements.md)
- [Backend Architecture §Volunteer](../PawHaven-Backend-Architecture.md)
- [Product Blueprint §10 (Volunteer Network)](../PawHaven-Product-Strategy-EN.md)
