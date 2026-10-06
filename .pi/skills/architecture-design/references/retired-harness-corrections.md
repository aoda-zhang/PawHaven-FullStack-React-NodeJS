# Corrections to the old docs

`.codebuddy/agents/architect.md` said the things below. Each was checked against the code and is
**false**:

- The repo anatomy omitted `packages/backend-core`, which exists and is central to backend work.
- The API impact table asked for "event contracts (publisher module, event name, payload)". There is
  no event bus.
- The risk table's Low example was "adding a standalone content module". There is no `content` module,
  and adding one is not automatically low-risk.

The corrected facts are in [architecture-design](../SKILL.md): the real service map under
[The real map](../SKILL.md#the-real-map), the "there is no event bus" note under
[Impact analysis](../SKILL.md#impact-analysis), and the current Low example under
[Classify the risk](../SKILL.md#classify-the-risk).

This file is kept rather than deleted because the note it corrects still circulates. The `.codebuddy/`
harness is gone; the wrong claims about it are not.
