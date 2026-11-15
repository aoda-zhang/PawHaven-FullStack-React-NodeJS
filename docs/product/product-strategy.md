# PawHaven — Product Strategy and Complete Product Blueprint

> **Document type:** Target product blueprint  
> **Status:** Aspirational product strategy; not an as-built specification  
> **Last updated:** 2026-11-15  
> **Product:** PawHaven — a community platform for stray-pet rescue

## 1. Product vision

PawHaven aims to connect people who discover stray pets with people who can help them, and to make each animal's journey visible from the first report through rescue, care, recovery, and (where appropriate) adoption.

The platform should reduce the fragmentation that often surrounds stray-pet rescue: reports are scattered, useful information is hard to find, potential helpers do not know where support is needed, and people who care about an animal cannot easily follow its progress.

**Product promise:** make it easier to report a stray pet, coordinate responsible help, and follow a transparent record of what happens next.

PawHaven is a coordination and information platform. It does not replace qualified veterinary care, local rescue organisations, or the judgement of people physically responsible for an animal.

## 2. Product scope

### 2.1 In scope

- Stray-pet reports and volunteer review before public publication.
- Public discovery of approved animal reports.
- A clear, auditable animal rescue lifecycle.
- Community participation through comments and following.
- User-submitted requests to change an animal's lifecycle status, reviewed by a volunteer.
- Volunteer applications, Admin approval, and Online / Local volunteer capabilities.
- Local volunteer service areas, including multiple areas.
- Adoption as a later stage of the animal journey, with its detailed operating model still subject to confirmation.
- Moderation and reporting mechanisms that protect the quality and safety of the community.

### 2.2 Out of scope

- Wildlife rescue and wildlife release workflows.
- Owner-reunification as a dedicated lifecycle outcome.
- Treating PawHaven as a veterinary provider or publishing unreviewed medical advice as professional guidance.
- Assuming that every rescue case will end in adoption.
- Treating unconfirmed concepts from older drafts as committed product requirements.

The supported animal taxonomy is stray pets. Whether the initial supported species are limited to cats and dogs or include other stray pets remains TBD.

## 3. Product principles

1. **Animal welfare first.** Encourage safe, responsible action; do not pressure unqualified users to attempt dangerous rescues.
2. **Moderated public information.** A new report is not public until a volunteer approves it.
3. **Transparent progress.** Public status changes should be understandable and attributable, while sensitive personal and location information remains protected.
4. **Permission by action.** A user account can report, follow, comment, volunteer, or adopt as applicable; these are capabilities, not mutually exclusive identities.
5. **Human review for consequential changes.** Volunteers review new reports and proposed lifecycle status changes.
6. **Low-friction participation.** Browsing and commenting should not require an account. Authentication is required for actions that need an attributable account, such as requesting a status change or following an animal.
7. **One understandable animal status.** Use one Animal Status field throughout the animal journey: it starts at `PENDING_REVIEW`, then moves to `NEEDS_HELP` after approval or `REJECTED` if declined, before progressing through rescue and care. Review decisions are actions that cause status transitions, not separate animal statuses.
8. **Honest product maturity.** Product ambition must remain distinguishable from implemented functionality.

## 4. Users and roles

PawHaven has four main access levels:

- **Guest:** an unauthenticated visitor who can browse public animals and comment.
- **Registered User:** an authenticated account that can submit animal reports, follow animals, comment, and request lifecycle status changes. Report submission is currently authentication-gated in the implementation; whether Guest reporting should be enabled in the future is TBD.
- **Volunteer:** a registered user whose application has been approved by an Admin. Volunteers review animal reports and status-change requests, moderate comments, and handle user reports.
- **Admin:** a platform administrator who manages platform-level operations, including approving or rejecting volunteer applications and revoking volunteer membership.

Volunteer capabilities are split into **Online Volunteer** and **Local Volunteer**. A Local Volunteer also has all Online Volunteer permissions and may additionally coordinate local, in-person assistance.

See [User Roles and Permissions](./user-roles-and-permissions.md) and [Volunteer Management](./volunteer-management.md).

## 5. The complete animal journey

The animal journey is the central product workflow:

1. **Discovery:** someone encounters a stray pet and decides to report it.
2. **Report submission:** a report is submitted with the information needed to identify and locate the animal.
3. **Volunteer review:** the report remains unpublished until a volunteer approves it.
4. **Publication:** an approved report becomes publicly discoverable. Its initial animal lifecycle status is NEEDS_HELP.
5. **Community engagement:** people can view the animal, comment, and follow it. Guests who try to follow are prompted to register or sign in before continuing.
6. **Help and rescue:** people with relevant local knowledge or capability may coordinate assistance. Local Volunteers can support in-person coordination. The detailed rescue assignment/claiming model remains TBD; the old first-come-first-claim design is not a confirmed requirement.
7. **Status updates:** a registered user submits a request to change the animal's status. A volunteer reviews it; one authorised volunteer's approval or rejection is sufficient. The status changes only after approval.
8. **Treatment and recovery:** the animal's progress is represented through lifecycle statuses and a history of approved updates.
9. **Adoption readiness:** once appropriate care and readiness have been established, the animal may enter AWAITING_ADOPTION.
10. **Adoption:** an adopter discovers the animal and may express interest or apply through a future adoption workflow. The detailed screening, decision-maker, handover, and post-adoption rules remain TBD.
11. **Outcome:** the animal may reach ADOPTED; a deceased animal may be recorded as DECEASED if that proposed status is confirmed. Exception paths are documented in the lifecycle specification.

PawHaven uses one Animal Status field from submission onward. A newly submitted animal is `PENDING_REVIEW` and is not public. When a Volunteer approves it, the status changes to `NEEDS_HELP` and the animal becomes public. If rejected, the status changes to `REJECTED` and the animal remains unpublished. `APPROVED` is the review action/decision, not an Animal Status.

See [Animal Lifecycle](./animal-lifecycle.md) for the full flow, decision gates, state definitions, and exception handling.

## 6. Reporting and publication

A report is a request to add an animal to PawHaven, not an automatically public rescue case. Every new report starts with Animal Status `PENDING_REVIEW` and must be reviewed by a Volunteer before it appears publicly.

- Submission creates an animal record with status `PENDING_REVIEW`; it is not publicly visible.
- A Volunteer reviews the information.
- Approval changes the same Animal Status field to `NEEDS_HELP` and publishes the animal.
- Rejection changes the same field to `REJECTED`; the animal remains unpublished.
- `APPROVED` is the review decision/action, not a separate Animal Status.
- Duplicate handling, rejection reasons, resubmission rules, and the visibility of review notes require further definition.

The exact report form fields and validation rules should be maintained against the reporting experience and confirmed separately; this strategy does not invent a new form schema.

## 7. Community participation

- Anyone can view publicly approved animals.
- Anyone can comment. Comments are published immediately and do not require volunteer pre-approval.
- Volunteers can delete any user's comment.
- Users can follow an animal. A Guest who selects Follow is prompted to register or sign in; after authentication, the product should return the user to the original animal and complete or resume the intended follow action.
- A Guest must register or sign in before submitting a lifecycle status-change request.
- A submitted status-change request is reviewed by a volunteer before it affects the public animal status.

See [Community and Engagement](./community-and-engagement.md).

## 8. Volunteer network

Volunteer participation is application-based, not an automatic opt-in.

- Applicants must first be shown the volunteer responsibilities and expectations.
- An applicant submits basic application information; identity documents, certificates, or other supporting credentials are not required by the agreed baseline.
- Only an Admin can approve or reject a volunteer application.
- A rejected applicant may apply again after a 30-day waiting period.
- Approved membership remains active until the volunteer voluntarily leaves or an Admin revokes it; it does not expire automatically.
- Both Online Volunteers and Local Volunteers are supported.
- Local Volunteers inherit all Online Volunteer permissions and may additionally assist with local coordination.
- A Local Volunteer can define multiple service areas, such as Berlin and Potsdam.

See [Volunteer Management](./volunteer-management.md).

## 9. Adoption

Adoption is part of the long-term animal journey, but its detailed business rules have not yet been fully agreed. The product should eventually provide accurate animal profiles, relevant care history, a clear way to express adoption interest, and a responsible handover process.

The platform must not present older draft assumptions—such as mandatory shelter staff approval, a specific application questionnaire, in-app interviews, or digital agreements—as confirmed requirements.

See [Adoption Workflow](./adoption-workflow.md) for the proposed end-to-end model and open decisions.

## 10. Trust, safety, and privacy

- Do not expose reporters' or volunteers' private contact details by default.
- Avoid publishing precise animal coordinates where doing so could create a safety risk.
- Make moderation actions attributable to the authorised volunteer who performed them.
- Use the single Animal Status field consistently; keep `PENDING_REVIEW` and `REJECTED` records unpublished.
- Preserve a history of approved lifecycle changes so the public timeline is explainable.
- Provide a way for users to report inappropriate content or misuse; volunteers handle these reports.
- Avoid encouraging untrained users to handle injured, frightened, or potentially dangerous animals.
- Define retention, deletion, location precision, and appeal policies before implementation.

The exact privacy defaults, data-retention periods, moderation escalation rules, and appeals process remain TBD.

## 11. Product capabilities

| Capability | Purpose |
|---|---|
| Animal reporting | Capture a new stray-pet sighting and send it for review. |
| Report moderation | Ensure only approved reports become public. |
| Animal discovery | Let the community find and understand approved animals needing help. |
| Animal lifecycle | Represent rescue progress with controlled, reviewable status changes. |
| Community interaction | Support comments and following. |
| Volunteer management | Recruit, approve, and manage Online and Local Volunteers. |
| Local coordination | Help Local Volunteers identify animals in their service areas and coordinate offline support. |
| Adoption | Support a responsible transition from recovery to a new home once the workflow is defined. |
| Notifications | Keep users informed about relevant events; detailed event rules and channels remain TBD. |
| Administration and moderation | Handle volunteer approvals, comment removal, and user reports. |

## 12. Future considerations

The following ideas from earlier product exploration may be valuable later, but they are **not confirmed MVP requirements**:

- Rescue knowledge base and educational guides.
- Rescue stories and post-adoption stories.
- Volunteer achievements, contribution statistics, and badges.
- Shelter or rescue-organisation accounts and dashboards.
- Advanced volunteer-to-case matching and automated notification escalation.
- In-app messaging and adoption interviews.
- Advanced analytics and regional resource directories.

See [Product Roadmap](./product-roadmap.md). Future consideration does not imply a delivery commitment.

## 13. Product documentation and implementation truth

This blueprint describes the intended product. It must be read alongside [Feature Documentation](../features/README.md), which records the current implementation and its gaps.

The current feature documentation reports that the complete lifecycle and transition history, volunteer network and role-based authorisation, status review, adoption applications, notifications, stories, knowledge base, achievements, and user profiles are not implemented as complete workflows. The existing AnimalStatus enum is not evidence that the target lifecycle is operational.

---

## Related documents

- [Animal Lifecycle](./animal-lifecycle.md)
- [User Roles and Permissions](./user-roles-and-permissions.md)
- [Volunteer Management](./volunteer-management.md)
- [Adoption Workflow](./adoption-workflow.md)
- [Community and Engagement](./community-and-engagement.md)
- [Product Roadmap](./product-roadmap.md)
- [Current Feature Documentation](../features/README.md)
