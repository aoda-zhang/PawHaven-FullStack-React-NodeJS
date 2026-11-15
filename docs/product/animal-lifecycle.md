# Animal Lifecycle — End-to-End Product Flow

> **Status:** Target workflow. Confirmed rules are distinguished from proposed states and open decisions.  
> **Scope:** Stray pets only; wildlife rescue and owner reunification are out of scope.

## 1. Lifecycle overview

An animal enters PawHaven through a report. The report must pass volunteer moderation before it becomes publicly visible. Once published, the animal moves through a separately managed rescue lifecycle.

**Main journey**

1. A person discovers a stray pet.
2. The person submits an animal report.
3. The report enters the volunteer review queue and remains unpublished.
4. A Volunteer approves or rejects the report.
5. An approved report is published with initial animal status NEEDS_HELP.
6. Guests and registered users view the animal; anyone can comment.
7. A user follows the animal, or a Guest registers/signs in to complete the Follow action.
8. People coordinate help and rescue; Local Volunteers may assist with local coordination.
9. A registered user requests a lifecycle status change.
10. A Volunteer reviews the request. One authorised Volunteer approval is sufficient.
11. Only an approved request changes the official animal status.
12. The animal may progress through treatment and recovery, then become available for adoption.
13. A future adoption process may lead to ADOPTED.

This flow does not imply automatic rescuer assignment, medical verification, or adoption approval by PawHaven.

## 2. Two independent state dimensions

A report's moderation state and an animal's real-world lifecycle state must be modelled separately.

### 2.1 Report publication state

The following names are a **proposed domain model**, not an approved enum:

| Proposed value | Meaning |
|---|---|
| PENDING_REVIEW | A submitted report is waiting for volunteer review. |
| APPROVED | A volunteer approved the report and it can be published. |
| REJECTED | A volunteer rejected the report; it is not publicly listed. |

**Confirmed rule:** every new animal report must be reviewed by a volunteer before public display.

Open decisions include rejection reasons, whether a rejected report can be edited and resubmitted, duplicate detection/merging, and whether review notes are visible to the reporter.

### 2.2 Animal lifecycle status

The current product discussion supports the following proposed lifecycle vocabulary:

| Proposed value | Meaning | Notes |
|---|---|---|
| NEEDS_HELP | The approved and published animal still needs rescue or assistance. | **Confirmed initial status** after report approval. |
| RESCUE_IN_PROGRESS | Rescue activity is actively underway. | Proposed replacement for the ambiguous inProgress. |
| UNDER_TREATMENT | The animal is receiving medical or other necessary care. | Proposed clearer meaning for treated. |
| RECOVERING | The animal is in a recovery or rehabilitation period. | Retains the existing concept. |
| AWAITING_ADOPTION | The animal is considered ready to be considered for adoption. | Adoption-readiness criteria are TBD. |
| ADOPTED | The animal has completed an adoption handover. | Exact completion evidence is TBD. |
| DECEASED | The animal has died. | Proposed explicit outcome; requires final confirmation. |

The names above are domain-level recommendations. Do not assume the current code enum or database already uses them.

### 2.3 Values that should not be carried forward as lifecycle states

- pending currently means a report is waiting for volunteer review. It belongs to report moderation, not the animal's rescue progress.
- failed is ambiguous: it could mean not found, escaped, deceased, or rescue not completed. These are materially different situations and should not be collapsed into one lifecycle status.
- REUNITED_WITH_OWNER is not needed for the agreed stray-pet product scope.
- RELEASED describes wildlife release and is outside the agreed scope.

An animal that cannot currently be found should not automatically be marked deceased or failed. The handling of temporarily unlocated animals remains TBD.

## 3. Stage-by-stage journey

### Stage 0 — Discovery

A person encounters a stray pet and may decide to submit a report.

- The product should make reporting easy to understand, including the importance of accurate location and useful observations.
- The platform should not encourage unsafe handling or require the reporter to approach the animal.
- The supported animal categories beyond the general stray-pet scope remain TBD.

**Authentication:** current feature documentation describes the report page as authentication-gated. Whether future product policy should allow Guest submissions remains TBD.

### Stage 1 — Report submission

The reporter submits the animal information through the report flow.

- Submission creates a report in the review queue.
- The report is not publicly discoverable while awaiting review.
- Exact required fields, photo rules, location precision, contact handling, and edit-after-submission policy must be aligned with the reporting feature specification and confirmed product requirements.

The report record is the entry point for the animal journey. Current feature documentation notes that the implementation uses the animal report as the rescue record rather than a separate rescue-case table; this is an implementation fact, not a requirement to preserve that data model forever.

### Stage 2 — Volunteer review and publication

A Volunteer reviews the submitted report.

**Confirmed:**
- A volunteer must review every new report.
- A report becomes public only after approval.
- A rejected report is not publicly displayed.

**Proposed review outcomes:**
- Approve and publish.
- Reject and keep unpublished.
- Identify as a possible duplicate and route for a defined duplicate-handling decision.

Duplicate workflow, review SLA, rejection reason, and reporter appeal/resubmission path remain TBD.

On approval, the animal becomes publicly visible with initial lifecycle status NEEDS_HELP.

### Stage 3 — Public discovery and community participation

After publication:

- Guests and registered users can view the animal's public details.
- Anyone can comment; comments are published immediately.
- Volunteers can delete any user's comment.
- Users can follow the animal.
- A Guest who attempts to follow is prompted to register or sign in. After authentication, the experience should return to the original animal and resume the follow action.
- A Guest must register or sign in before requesting a lifecycle status change.

Public animal details must not expose private reporter contact details or unnecessarily precise location data.

### Stage 4 — Help coordination and rescue

The community can identify where help is needed. Local Volunteers may assist with in-person coordination within their selected service areas.

The following are **not yet confirmed**:
- Whether a volunteer or another user formally claims/owns a rescue case.
- Whether multiple volunteers can coordinate on one animal.
- Whether rescue tasks, transport, fostering, or expenses are tracked in PawHaven.
- Whether a Local Volunteer is expected to verify the animal physically before requesting a status change.
- Whether the platform matches animals to volunteers automatically.

Do not reintroduce the older first-come-first-claim workflow as a requirement without product approval.

### Stage 5 — Status-change request and review

A registered user can submit a request to change an animal's lifecycle status.

**Confirmed rules:**
- A Guest must authenticate before submitting the request.
- Every status-change request is reviewed by a Volunteer.
- One authorised Volunteer can approve or reject the request; multiple approvals are not required.
- The animal's official status changes only after approval.
- Local Volunteers follow the same review process as other users. Local presence does not bypass review.

A request should identify the requested new status and provide enough context for a reviewer to make a responsible decision. Exact request fields, evidence requirements, edit/cancel behavior, and notification behavior remain TBD.

The system should preserve an auditable record of approved changes. Whether rejected requests and reviewer notes are visible to the requester or public is TBD.

### Stage 6 — Treatment and recovery

The proposed lifecycle may progress through:
1. RESCUE_IN_PROGRESS
2. UNDER_TREATMENT
3. RECOVERING

These statuses communicate progress; they do not certify medical facts. PawHaven should not represent a treatment as professionally verified unless a suitable verification process exists.

Who is responsible for care updates, whether medical documents can be attached, and what evidence is required for each transition remain TBD.

### Stage 7 — Adoption readiness

When the animal is considered ready for adoption, its status may change to AWAITING_ADOPTION.

The product still needs to define:
- Who determines adoption readiness.
- Whether health, vaccination, sterilisation, or behavioral information is required.
- Whether an organisation or individual caretaker manages the listing.
- Which animal details are public.

### Stage 8 — Adoption

The target journey should allow a prospective adopter to learn about the animal, express interest, and complete a responsible handover. The detailed workflow is not yet confirmed.

ADOPTED should represent a completed handover, not merely an expression of interest or an application approval.

See [Adoption Workflow](./adoption-workflow.md).

## 4. Exception and edge-case paths

| Scenario | Target handling | Decision status |
|---|---|---|
| Report rejected | Keep it unpublished; communicate the outcome to the reporter. | Rejection reason and resubmission policy TBD. |
| Duplicate report | Avoid presenting two independent public journeys for the same animal; define a link/merge process. | Proposed; merge rules TBD. |
| Animal cannot be located | Keep the record truthful; do not infer death. | TBD whether to add a temporary UNLOCATED state or an incident attribute. |
| Rescue cannot proceed | Record the factual situation and next steps without using an ambiguous FAILED status. | TBD. |
| Animal dies | DECEASED is the proposed explicit outcome. | Requires final confirmation. |
| Adoption falls through | Define whether the animal returns to NEEDS_HELP / AWAITING_ADOPTION or a new listing is created. | TBD. |
| Incorrect status request | Volunteer rejects it; official status remains unchanged. | Review rule confirmed; reason/appeal TBD. |
| Inappropriate comment | Volunteer can remove it. | Removal permission confirmed; user notification/appeal TBD. |

## 5. Transition governance

A status change must be treated as a reviewed request, not a direct edit by an arbitrary user.

Recommended conceptual sequence:
1. User selects the animal and requests a new status.
2. The system records the requested transition separately from the official status.
3. A Volunteer reviews the request.
4. The Volunteer approves or rejects it.
5. If approved, the official animal status changes and the history records the decision.
6. Relevant users may be notified once notification rules are defined.

The exact transition matrix, concurrency handling, self-review restrictions, and administrative override policy remain TBD.

## 6. Public timeline and audit history

The animal detail page should eventually distinguish:
- Current approved lifecycle status.
- Timestamped history of approved status changes.
- Public updates and comments.
- Report/publication context where appropriate.
- Sensitive moderation data that must remain private.

A timeline should not imply that an event occurred merely because a user submitted a request. Only approved status changes should update the official lifecycle timeline.

## 7. Open product decisions

1. Can Guests submit reports, or must reporters sign in?
2. What are the exact required report fields and validation rules?
3. What are the rejection, resubmission, and duplicate-report rules?
4. Is DECEASED an approved terminal status?
5. What are the allowed status transitions, including adoption failure?
6. Who can submit status requests, and what evidence is required?
7. Can a requester review their own status-change request?
8. How are rescue coordination, fostering, transport, and care responsibility represented?
9. Who confirms adoption readiness and completion?
10. What information is public, private to the reporter, or visible only to Volunteers/Admins?
