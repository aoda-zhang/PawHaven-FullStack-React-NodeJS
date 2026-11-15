# Community and Engagement

> **Status:** Confirmed baseline interaction rules plus future capabilities and open decisions.

## 1. Purpose

PawHaven should let people participate in an animal's journey without forcing every visitor to create an account. Public discovery and conversation help build awareness; authentication is reserved for actions that need a persistent user identity.

## 2. Public animal discovery

- Guests and registered users can browse approved, publicly visible animals.
- Reports awaiting volunteer review and rejected reports are not part of the public discovery experience.
- Animal details should expose only information intended for public use.
- Sensitive contact details and unnecessarily precise animal locations should not be public by default.

Search, map filters, saved searches, and personalised discovery are future product decisions unless separately confirmed.

## 3. Comments

**Confirmed rules:**
- Anyone can comment, including Guests and registered users.
- A newly submitted comment is published immediately; it does not require volunteer pre-approval.
- Volunteers have permission to delete any user's comment.

Open decisions:
- Whether Guest comments require CAPTCHA, rate limiting, or another abuse-prevention mechanism.
- Whether a Guest can edit or delete their own comment after posting.
- Whether registered users can edit or delete their own comments.
- Whether Volunteers must provide a removal reason.
- Whether users are notified when a comment is removed and can appeal.
- Whether Admins have additional comment moderation powers.

The product should provide clear community guidelines and server-side abuse controls.

## 4. Following an animal

Following lets a user keep track of an animal's journey.

**Confirmed product intent:**
- Any visitor can initiate the Follow action.
- If a Guest selects Follow, show a clear prompt explaining that an account is required.
- Selecting the sign-up action takes the Guest to the registration flow.
- After registration or sign-in, return the user to the original animal and complete or resume the Follow action.

The product should preserve the intended animal context across authentication. The exact behavior for cancelled registration, expired sessions, and an already-followed animal remains an implementation detail to define.

## 5. Status-change requests

A status-change request is a community contribution, not a direct status edit.

- A Guest must register or sign in before submitting a request.
- A registered user can submit a request for a lifecycle status change.
- A Volunteer reviews the request.
- One authorised Volunteer can approve or reject it.
- The official animal status changes only after approval.
- Local Volunteers use the same review process.

The request should be distinguishable from the approved public timeline. Supporting evidence, request visibility, reviewer notes, and notification rules remain TBD.

## 6. User reports and moderation

Volunteers are authorised to handle user reports. The product should eventually support a consistent reporting path for inappropriate comments, misleading information, abuse, or other policy violations.

The exact report categories, investigation workflow, escalation path, response time, sanctions, and appeal policy are not yet confirmed.

## 7. Notifications (future capability)

Notifications are a likely supporting capability, but no complete notification policy has been agreed.

Potential events include:
- A user's report is approved or rejected.
- A status-change request is approved or rejected.
- An animal followed by the user changes status.
- A comment is removed or a user report is handled.
- A Volunteer application is approved or rejected.

Before implementation, define:
- In-app versus email or push delivery.
- Which events are essential.
- User preferences and opt-outs.
- Frequency limits and duplicate suppression.
- Whether Guests receive any follow-up through an email address.
- Privacy-safe notification content.

Do not assume automatic proximity-based Volunteer alerts or escalation schedules are confirmed.

## 8. Future community capabilities

These ideas may strengthen the community but are not MVP commitments:
- Rescue stories and post-adoption stories.
- A curated rescue knowledge base.
- Volunteer contribution statistics and achievements.
- Public profiles and contribution histories.
- Bookmarks, likes, and other engagement mechanisms.
- Community resource directories.

See [Product Roadmap](./product-roadmap.md).

## 9. Open decisions

1. What anti-spam controls are required for Guest comments?
2. Can users edit or delete their own comments?
3. What is the comment-removal notification and appeal process?
4. What categories and escalation outcomes exist for user reports?
5. Which lifecycle events trigger notifications?
6. Which notification channels are supported at launch?
7. Are public profiles and contribution histories in scope?
