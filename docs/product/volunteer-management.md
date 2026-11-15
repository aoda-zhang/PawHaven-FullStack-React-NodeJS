# Volunteer Management

> **Status:** Confirmed membership rules and volunteer types, with operational details marked TBD.

## 1. Purpose

PawHaven needs a trusted volunteer community to review new animal reports, review proposed lifecycle changes, moderate comments, and handle user reports. Local Volunteers may additionally help coordinate assistance in their service areas.

Volunteer membership is an approved capability, not an automatic opt-in at registration.

## 2. Volunteer application journey

1. A Registered User opens the Become a Volunteer entry point.
2. The user reads the volunteer responsibilities and expectations.
3. The user submits a basic application.
4. The application enters the Admin review queue.
5. An Admin approves or rejects the application.
6. On approval, the user receives Volunteer permissions.
7. On rejection, the applicant may apply again after a 30-day waiting period.
8. Approved membership remains active until the Volunteer leaves or an Admin revokes it.

## 3. Application requirements

**Confirmed:**
- The user must be shown the volunteer responsibilities and expectations before applying.
- The applicant provides basic application information.
- Identity documents, certificates, and additional proof are not required by the agreed baseline.
- Only an Admin can approve or reject the application.
- A rejected applicant may apply again after a 30-day waiting period.

The exact application fields, Admin review queue, decision SLA, rejection-reason policy, and whether application history is retained remain TBD.

## 4. Volunteer types

### Online Volunteer

Online Volunteers help through PawHaven's online workflows:
- Review new animal reports.
- Approve or reject lifecycle status-change requests.
- Delete comments when moderation is needed.
- Handle user reports.

### Local Volunteer

Local Volunteers have every Online Volunteer permission, plus the ability to participate in local or in-person coordination. Examples may include:
- Visiting or checking the reported animal's location when safe and appropriate.
- Contacting local rescue organisations or relevant community groups.
- Helping coordinate local rescue activities.

These examples describe the intended local-support direction; exact operational duties, safety requirements, and liability boundaries need further definition.

## 5. Service areas

**Confirmed:** Local Volunteers can configure multiple service areas. A person may, for example, support both Berlin and Potsdam.

The service-area model should be structured rather than stored as one free-text location, so PawHaven can eventually match animals to volunteers who cover the relevant area.

Still TBD:
- Whether an area is represented by city, district, postal code, polygon, or radius.
- Whether a volunteer can set a preferred or maximum travel distance.
- Whether service areas are public or private.
- Whether service areas are used for matching, notifications, or only profile display.
- Whether Online Volunteers have a location field at all.

A precise home address is not established as a requirement for volunteer service-area configuration.

## 6. Membership lifecycle

**Confirmed:**
- Approved membership remains active long-term.
- Membership does not expire automatically.
- A Volunteer may voluntarily leave.
- An Admin may revoke Volunteer membership.

Still TBD:
- Whether a temporary suspension state is needed.
- Whether a reason is required when an Admin revokes membership.
- Whether the Volunteer can appeal a revocation.
- Whether membership changes and prior applications are retained in an audit history.
- What happens to in-progress review tasks when a Volunteer leaves or is revoked.

## 7. Review responsibilities

| Work queue | Volunteer action | Result |
|---|---|---|
| New animal reports | Review report information | Approve and publish, or reject and keep unpublished |
| Status-change requests | Review requested transition and supporting context | Approve or reject; official status changes only on approval |
| Comments | Review community content when necessary | Delete inappropriate comments |
| User reports | Investigate the reported content or behavior | Handle the report under a policy that remains to be defined |

Any one authorised Volunteer can approve or reject a status-change request. The workflow does not require multiple Volunteer approvals.

Local Volunteers follow the same approval process as Online Volunteers. Being physically near an animal does not grant direct status-edit permission.

## 8. Admin responsibilities

Only Admins can approve or reject Volunteer applications. Admins can also revoke an existing Volunteer membership.

The product should keep the Volunteer application workflow separate from animal report and status moderation. Ordinary Volunteers must not be able to approve other Volunteer applicants.

## 9. Notifications and workload

Volunteer notifications, queue assignment, workload balancing, review SLAs, and escalation rules have not been confirmed. Avoid assuming automatic case claiming, proximity-based push notifications, or first-come-first-claim assignment.

These capabilities may be considered after the basic review workflow and role enforcement are reliable.

## 10. Open decisions

1. What exact fields appear in the basic application?
2. Must Admin provide a reason when rejecting an application?
3. Are application records and membership history retained?
4. Is a temporary suspension state required?
5. What happens to open tasks when a membership ends?
6. How are local service areas represented and validated?
7. What safety guidance and operational boundaries apply to Local Volunteers?
8. Are volunteer notifications required for the first release, and what events trigger them?
