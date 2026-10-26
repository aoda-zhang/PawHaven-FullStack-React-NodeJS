# Report Format Reference

Finding structure, report sections, and verdict criteria for instruction audit reports.

## Finding Structure

Each substantive finding must contain:

```markdown
### FINDING-<ID> [<Severity>] <Category>

**Location:** `<file-path>` [heading or line range]
**Evidence:** <exact instruction, omission, contradiction, or verified result>
**Problem:** <what is wrong and why it matters>
**Impact:** <concrete or reasonably foreseeable effect on execution, reliability, maintainability, safety, or context efficiency>
**Recommendation:** <smallest practical change addressing the problem>
**Confidence:** <Verified|Likely|Unverified> — <reason for uncertainty if applicable>
**Type:** <Defect|Improvement|Optional preference>
```

## Report Sections

### 1. Audit Summary

- **Target:** File path(s) and type(s)
- **Mode:** Single-file / Cross-file
- **Scope:** Inspected dependencies and related files
- **Overall assessment:** One-paragraph summary
- **Main risks:** Top 3 risks identified
- **Strengths:** What works well

### 2. Findings

- Prioritized by severity (Critical → High → Medium → Low)
- Grouped by category when helpful
- Include file and line references when available
- Each finding uses the structure above

### 3. Duplication and Conflicts

- Cross-file duplicate content
- Conflicting requirements
- Responsibility overlap / ownership gaps
- Inconsistent handoffs or verification requirements
- If no meaningful cross-file evidence: state limitation explicitly

### 4. Recommended Changes

- Concrete changes grouped by priority (Critical/High first)
- For each: what to add, remove, consolidate, or rewrite and why
- Prefer minimal, targeted corrections over broad rewrites
- Distinguish Defect / Improvement / Optional preference

### 5. Validation

- Checks actually performed and outcomes
- Behavioral tests worth running (not yet run)
- Unverified assumptions and outstanding limitations
- Do not claim tests executed unless they actually occurred

### 6. Verdict

One of:

- **Pass** — No material defects identified within audited scope
- **Pass with improvements** — No blocking defects, but meaningful improvements remain
- **Needs revision** — One or more material defects require correction
- **Insufficient evidence** — Available context inadequate for reliable assessment

The verdict must reflect actual findings and audit coverage. A clean report does not prove effectiveness in every runtime.

## Output Requirements

- Concise, actionable Markdown
- No generic advice, repetitive explanations, or artificial checklists
- Evidence-backed; distinguish confirmed defects from potential issues
- Explicit about scope limitations
