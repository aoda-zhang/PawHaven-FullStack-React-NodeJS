# Adoption Workflow

> **Status:** Future product workflow. The detailed rules in this document are proposals, not confirmed requirements.

## 1. Purpose

Adoption is a possible outcome of a successful stray-pet rescue journey. PawHaven should eventually help prospective adopters understand an animal's needs and history, express interest, and complete a responsible handover.

The platform must not imply that an animal is available for adoption before the responsible caretaker or authorised process has established that it is ready.

## 2. Entry into adoption

The proposed entry point is an animal whose lifecycle status is AWAITING_ADOPTION.

The product still needs to decide:
- Who can request or approve the transition to AWAITING_ADOPTION.
- What readiness criteria apply.
- Whether a caretaker, rescue organisation, or Volunteer manages the listing.
- Which medical, behavioral, and care details are required.
- Which details can be publicly displayed.

The status should not be used as a substitute for a complete adoption-readiness assessment.

## 3. Prospective adopter journey (proposed)

1. Discover an animal marked AWAITING_ADOPTION.
2. Review the public profile and available history.
3. Express interest or submit an application.
4. The responsible party reviews the application or expression of interest.
5. The reviewer may request more information, decline the application, or proceed.
6. The parties arrange a responsible handover.
7. The animal transfer is confirmed.
8. The animal is marked ADOPTED.

This is a conceptual journey only. It does not establish who the responsible reviewer is or whether PawHaven will provide messaging, interviews, home checks, or digital agreements.

## 4. Animal adoption profile (proposed)

A future adoption listing may include:
- Current photos and a clear description.
- Approximate age and known characteristics.
- Temperament and observed behavior, with unknown information clearly labeled.
- Known care and medical history where disclosure is appropriate.
- Special care needs.
- Current location at an appropriately coarse level.
- The animal's rescue timeline and current caretaker or responsible organisation, where permission exists.

Do not fabricate unknown age, breed, medical history, or behavioral suitability. Distinguish verified facts from observations and unverified information.

## 5. Application and review (TBD)

The exact application form, eligibility criteria, review authority, and decision process have not been agreed.

Earlier drafts proposed detailed housing questionnaires, interviews, shelter-staff approval, home photos, and adoption agreements. These remain ideas only and must not be treated as requirements.

Questions to resolve:
- Must adopters have a registered account?
- What information is necessary and proportionate to collect?
- Who receives and reviews applications: the caretaker, an organisation, an Admin, or a designated Volunteer?
- Are multiple applicants allowed at once?
- Can an applicant withdraw?
- What reasons and feedback are provided when an application is declined?
- Are in-person meetings or home checks part of the process?
- Does PawHaven store an adoption agreement, or merely record that a handover occurred?

## 6. Adoption completion

**Proposed rule:** ADOPTED should be set only after the animal has actually been handed over to the adopter, not merely when an application is approved.

The product should define what evidence or confirmation is sufficient and who is authorised to confirm completion.

Once adoption is complete, the animal's public history may show the outcome while protecting the adopter's personal information.

## 7. Adoption does not work out

An adoption can fail or be reversed. The product must not assume that ADOPTED is always an irreversible terminal state.

A decision is still required on whether:
- The same animal record returns to NEEDS_HELP or AWAITING_ADOPTION.
- A new adoption episode is created while preserving the original history.
- A return-to-care review is required before relisting.
- The previous adopter's information is hidden or retained under a defined privacy policy.

This question is explicitly open; no option is treated as approved.

## 8. After adoption (future consideration)

Possible later capabilities include:
- Optional adopter updates or photos.
- Follow-up reminders and welfare check-ins.
- A post-adoption story, if the adopter chooses to share one.
- A record of the adoption outcome in the animal's timeline.

These are optional future ideas, not MVP commitments.

## 9. Open decisions

1. Readiness criteria and who approves them.
2. Listing ownership and maintenance.
3. Account requirements for adopters.
4. Application fields and privacy basis.
5. Review authority and decision criteria.
6. Interview, meeting, agreement, and handover expectations.
7. Evidence required to mark ADOPTED.
8. Handling of failed or reversed adoptions.
9. Post-adoption contact, retention, and privacy rules.
