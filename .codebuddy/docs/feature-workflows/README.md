# Feature Workflows

This folder contains **one end-to-end workflow document per feature**. pawhaven
loads the relevant doc(s) when asked to build a feature (e.g. "build the report animal
feature", "build rescue cases").

Each doc follows the same template so the flow is always traceable:

1. **Overview** — what the feature is and where it sits in the product.
2. **Actors & Roles** — who interacts with it.
3. **End-to-End Flow** — the click-by-click journey (user action → frontend → API → backend → data → where the user sees it again), rendered as a **Mermaid flowchart**.
4. **Frontend** — pages, components, routes, server-driven menu key.
5. **Backend** — module, endpoints, use cases, events.
6. **Data Model** — collections / entities owned by the feature.
7. **State Machine / Rules** — status transitions and invariants.
8. **Acceptance Criteria** — what "done" means.
9. **Related Docs** — pointers into the architecture docs.

## Index

| #   | Feature                           | Doc                                                          | MVP Priority |
| --- | --------------------------------- | ------------------------------------------------------------ | ------------ |
| 1   | Authentication & Authorization    | [`01-auth.md`](./01-auth.md)                                 | P0           |
| 2   | Report a Stray Animal             | [`02-report-animal.md`](./02-report-animal.md)               | P0           |
| 3   | Rescue Case Lifecycle             | [`03-rescue-case.md`](./03-rescue-case.md)                   | P0           |
| 4   | Volunteer Network & Case Claiming | [`04-volunteer.md`](./04-volunteer.md)                       | P0           |
| 5   | Adoption                          | [`05-adoption.md`](./05-adoption.md)                         | P1           |
| 6   | Rescue Stories                    | [`06-rescue-stories.md`](./06-rescue-stories.md)             | P2           |
| 7   | Knowledge Base                    | [`07-knowledge-base.md`](./07-knowledge-base.md)             | P2           |
| 8   | Notifications                     | [`08-notifications.md`](./08-notifications.md)               | P0           |
| 9   | Profile & Achievements            | [`09-profile-achievements.md`](./09-profile-achievements.md) | P1           |
| 10  | Homepage & Discovery              | [`10-homepage-discovery.md`](./10-homepage-discovery.md)     | P0           |
| 11  | Bootstrap & Server-Driven Routing | [`11-bootstrap.md`](./11-bootstrap.md)                       | P0           |

## How pawhaven uses these

- When the user asks to build "XX feature", load the matching doc above.
- Cross-cutting docs to load alongside: [Authentication](../authentication-architecture.md),
  [System Architecture Overview](../PawHaven-System-Architecture-Overview.md),
  [Frontend Architecture](../PawHaven-Frontend-Architecture.md),
  [Backend Architecture](../PawHaven-Backend-Architecture.md),
  [Figma Design Spec](../figma-design-spec.md).
- Endpoints in these docs go through the API Gateway; internal service routing is
  defined in [System Architecture Overview §5](../PawHaven-System-Architecture-Overview.md).

## Feature → Module Mapping (for builders)

| Feature doc            | Frontend feature(s)    | Backend module(s)                | Key collections                                               |
| ---------------------- | ---------------------- | -------------------------------- | ------------------------------------------------------------- |
| Auth                   | `Auth`                 | auth-service                     | users, sessions                                               |
| Report Animal          | `Report`               | Reporting                        | stray_reports, urgency_assessments                            |
| Rescue Case            | `Rescue`, `Home`       | Rescue                           | rescue_cases, rescue_transitions                              |
| Volunteer              | `Volunteer`            | Volunteer                        | volunteer_profiles, case_claims                               |
| Adoption               | `Adoption`             | Adoption                         | adoption_listings, adoption_applications, adoption_agreements |
| Rescue Stories         | `Content`              | Content                          | stories                                                       |
| Knowledge Base         | `Content`              | Content                          | knowledge_articles, content_reviews                           |
| Notifications          | `Profile` (bell/prefs) | Notification                     | notifications, notification_prefs                             |
| Profile & Achievements | `Profile`              | Profile, Achievement             | achievements, milestones                                      |
| Homepage & Discovery   | `Home`, `Discovery`    | Rescue, Adoption, Content (read) | (read-only aggregation)                                       |
| Bootstrap              | `Landing`              | Bootstrap, config-service        | menus, routes, roles                                          |

> Collections are owned by their module only (module boundary rule, see
> [System Architecture Overview §11-12](../PawHaven-System-Architecture-Overview.md)).
