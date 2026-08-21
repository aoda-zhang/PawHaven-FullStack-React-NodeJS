# Never Block on the Human

Proceed on reversible work; present the result, let the human course-correct.

## When it applies

Tempted to ask "should I do X?" on reversible work.

## The rule

Most questions are answerable by doing: prototype it, run it, show the diff. Asking is the slow path and hands the human a decision instead of a result. Reserve questions for genuine product or preference calls no experiment can settle (naming, scope, business rules).

If the answer is observable by running something, run it. If the work is reversible (a branch, a diff, a sketch), do it and present.

## PawHaven notes

- "Which layout should this be?" → build the candidate and render it.
- "Should we use hook A or B?" → prototype the smaller one, show the result.
- "Is this i18n key right?" → follow the existing key convention in the locale files; flag it in the summary if unsure.
- Irreversible actions (push to shared branches, deploy, delete data) always pause. That is the exception, not the rule.

## Anti-pattern

Stopping mid-task to ask a question whose answer you could have produced by running the code.
