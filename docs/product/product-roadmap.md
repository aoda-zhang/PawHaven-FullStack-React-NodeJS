# PawHaven Product Roadmap

> **Status:** Proposed sequencing for product planning. This is not a delivery commitment or a dated release plan.

## 1. Roadmap principles

- Build the trusted core workflow before adding engagement mechanics.
- Treat report moderation and lifecycle review as foundational safety and data-quality requirements.
- Enforce permissions on the backend before expanding privileged actions.
- Do not build advanced automation on top of workflows whose ownership and rules are unresolved.
- Keep current implementation status separate from future product priorities.

## 2. Phase 0 — Product and domain foundations

**Goal:** turn the agreed product rules into an implementation-ready domain model.

Proposed work:
- Confirm report publication states and animal lifecycle statuses.
- Confirm allowed lifecycle transitions and exception handling.
- Define report rejection, duplicate, and resubmission behavior.
- Finalise Guest reporting policy and report form requirements.
- Define role and permission enforcement, including Admin boundaries.
- Define the status-change request and review record.
- Agree public/private data boundaries and location precision.
- Resolve adoption-readiness ownership and the initial adoption workflow.

**Exit criteria:** the core domain vocabulary, permission matrix, review gates, and unresolved policy decisions are explicit and accepted.

## 3. Phase 1 — Trusted reporting and public discovery

**Goal:** ensure that reports enter the platform consistently and only approved animals become public.

Proposed capabilities:
- Authenticated animal report submission (current behavior is auth-gated; future Guest policy remains to be confirmed).
- Report review queue for Volunteers.
- Approve/reject decisions and public publication gate.
- Initial animal lifecycle status NEEDS_HELP after approval.
- Public animal list and detail experience.
- Basic duplicate handling policy.
- Appropriate validation, privacy, and abuse prevention.

**Exit criteria:** a report can be submitted, reviewed, and either published or rejected with a clear outcome.

## 4. Phase 2 — Controlled lifecycle and community participation

**Goal:** make animal progress trustworthy and allow the community to participate.

Proposed capabilities:
- Separate report moderation state from animal lifecycle status.
- Status-change request submission.
- Volunteer approval/rejection workflow with one-reviewer decision.
- Auditable history of approved status changes.
- Public comments for Guests and registered users.
- Volunteer comment deletion and user-report handling.
- Animal following, including Guest sign-up/sign-in continuation.
- Basic account-facing history for a user's own reports and follows, if confirmed.

**Exit criteria:** lifecycle changes cannot bypass review, and the public animal page reflects only approved status changes.

## 5. Phase 3 — Volunteer network and local coordination

**Goal:** recruit volunteers and support online moderation and local help.

Proposed capabilities:
- Volunteer responsibilities and application experience.
- Admin-only approval/rejection of applications.
- 30-day reapplication waiting period after rejection.
- Long-lived membership with voluntary exit and Admin revocation.
- Online Volunteer permissions.
- Local Volunteer type and multiple structured service areas.
- Basic Volunteer administration and audit history.

**Exit criteria:** Volunteer access is granted only through Admin approval and protected actions are authorised server-side.

## 6. Phase 4 — Adoption workflow

**Goal:** provide a responsible transition from recovery to adoption.

Dependent on decisions about:
- Adoption readiness and who confirms it.
- Public adoption profile content.
- Applicant identity and form requirements.
- Review authority and selection process.
- Handover confirmation and failed-adoption handling.

Potential capabilities:
- Adoption listings for AWAITING_ADOPTION animals.
- Adoption interest/application workflow.
- Application review and communication.
- Handover confirmation and ADOPTED status.
- Optional post-adoption follow-up.

**Exit criteria:** an animal is marked adopted only after a defined and confirmed handover process.

## 7. Phase 5 — Supporting ecosystem (future considerations)

Potential capabilities, subject to validation:
- Rescue knowledge base and educational guides.
- Rescue stories and post-adoption stories.
- Volunteer achievements and contribution statistics.
- Shelter and rescue-organisation collaboration.
- Notifications across in-app, email, or push channels.
- Volunteer-to-animal matching and workload management.
- Regional resource directories and analytics.

These ideas were present in earlier product exploration, but they are not confirmed MVP scope. Prioritise them only when the core rescue workflow demonstrates a clear need.

## 8. Dependencies and sequencing

| Capability | Depends on |
|---|---|
| Public animal discovery | Report review and publication rules |
| Lifecycle status updates | Lifecycle vocabulary, transition policy, and Volunteer authorisation |
| Following | Authentication continuation and follow persistence |
| Notifications | Defined events, preferences, and delivery channels |
| Local Volunteer matching | Structured service areas and animal location policy |
| Adoption applications | Adoption readiness, reviewer ownership, and privacy policy |
| Stories and achievements | Reliable lifecycle history and contribution attribution |
| Knowledge base | Editorial ownership and content quality/safety process |

## 9. Current implementation is not the roadmap

The [Feature Documentation](../features/README.md) describes what is currently implemented. It reports important gaps, including the absence of a complete lifecycle transition workflow, Volunteer network and RBAC enforcement, adoption applications, notifications, stories, knowledge base, achievements, and user profiles.

Roadmap phases should be estimated only after the relevant domain rules are confirmed and the current codebase has been assessed. No delivery dates or completion claims are made here.
