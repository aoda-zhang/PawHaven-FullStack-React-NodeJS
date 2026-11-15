# User Roles and Permissions

> **Status:** Confirmed baseline permissions plus clearly marked open decisions.

## 1. Access model

PawHaven uses one account model with capabilities granted by authentication and approved roles. Reporting, following, commenting, volunteering, and adopting are activities; they should not be treated as mutually exclusive user identities.

| Access level | Description |
|---|---|
| Guest | Visitor who is not signed in. |
| Registered User | Authenticated account with standard user capabilities. |
| Online Volunteer | Registered User with an Admin-approved volunteer membership. |
| Local Volunteer | Volunteer with all Online Volunteer capabilities plus local coordination responsibilities. |
| Admin | Platform administrator with platform-level management permissions. |

A Local Volunteer is not a separate permission tier: Local Volunteer includes Online Volunteer capabilities.

## 2. Permission matrix

Legend: **Yes** = confirmed capability; **No** = not granted by the agreed baseline; **TBD** = requires a product decision.

| Action | Guest | Registered User | Online Volunteer | Local Volunteer | Admin |
|---|---:|---:|---:|---:|---:|
| Browse public animals | Yes | Yes | Yes | Yes | Yes |
| View public animal details | Yes | Yes | Yes | Yes | Yes |
| Comment on an animal | Yes | Yes | Yes | Yes | Yes |
| Follow an animal | Sign-in required | Yes | Yes | Yes | Yes |
| Submit an animal report | TBD; current implementation is auth-gated | Yes | Yes | Yes | Yes |
| Review a new animal report | No | No | Yes | Yes | TBD / platform override |
| Request an animal status change | Sign-in required | Yes | Yes | Yes | TBD |
| Approve/reject a status-change request | No | No | Yes | Yes | TBD / platform override |
| Delete any user's comment | No | No | Yes | Yes | TBD / platform override |
| Handle user reports | No | No | Yes | Yes | TBD / platform override |
| Apply to become a Volunteer | No | Yes | Existing member | Existing member | Yes |
| Approve/reject Volunteer applications | No | No | No | No | Yes |
| Revoke Volunteer membership | No | No | No | No | Yes |
| Define multiple local service areas | No | No | Not applicable | Yes | Administrative support TBD |

The matrix deliberately does not assume Admin has every Volunteer action in the same way, or that Admin has direct lifecycle override permission. Those policies should be explicitly defined rather than inferred from the role name.

## 3. Guest

Guests can:
- Browse publicly approved animals and their public details.
- Read public comments.
- Publish comments.
- Start the Follow action and be prompted to register or sign in.

Guests must authenticate before:
- Following an animal.
- Submitting an animal status-change request.

Whether Guests can submit animal reports is TBD. The current feature documentation describes the report route as authentication-gated.

## 4. Registered User

Registered Users inherit Guest public browsing capabilities and can:
- Submit animal reports.
- Follow animals.
- Comment on animal pages.
- Request animal lifecycle status changes.
- Apply to become a Volunteer.

A Registered User cannot approve their own report, approve a lifecycle status request, moderate other users' comments, or approve Volunteer applications unless they separately hold the relevant approved role.

## 5. Volunteer

Volunteer membership is granted only after an Admin approves an application.

Confirmed Volunteer permissions:
- Review and approve/reject new animal reports.
- Review and approve/reject animal status-change requests.
- Delete any user's comment.
- Handle user reports.

A Volunteer does not approve Volunteer applications. That permission belongs to Admins only.

### Online Volunteer

Online Volunteers perform platform-based moderation and review work. They do not automatically receive local coordination responsibilities.

### Local Volunteer

Local Volunteers:
- Have all Online Volunteer permissions.
- May participate in local, in-person rescue coordination.
- Can select multiple service areas.
- Must use the same animal status-change request and review workflow as other users; local presence does not grant a bypass.

The exact service-area data model and operational scope of local coordination remain TBD.

## 6. Admin

Admin responsibilities confirmed in the current product discussion:
- Approve or reject Volunteer applications.
- Revoke an existing Volunteer membership.

Admin is the only role authorised to approve Volunteer applications.

Other platform-level responsibilities—such as account suspension, global configuration, overriding a moderation decision, changing animal status directly, or reviewing appeals—need explicit policy decisions.

## 7. Permission enforcement principles

- Enforce permissions on the server/API, not only by hiding frontend controls.
- Treat the client UI as a presentation of permissions, not the security boundary.
- Keep report publication permissions separate from lifecycle transition permissions.
- Record the actor and timestamp for moderation decisions.
- Do not grant Local Volunteers a bypass around status review.
- Re-check role membership at the time of each protected action.

## 8. Open decisions

- Can Admin directly perform all Volunteer moderation actions?
- Can Admin override an approved or rejected animal status request?
- Can a Volunteer review a request they submitted?
- Can Volunteers edit a submitted report, or only approve/reject it?
- What additional permissions, if any, belong to Admin beyond Volunteer application management?
- Can a Guest submit an animal report in the target product?
