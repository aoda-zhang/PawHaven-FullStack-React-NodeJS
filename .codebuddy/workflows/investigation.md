# Investigation

You own this task. Answer from evidence, stay in the lead.

An investigation is a read-only question: how does X work, why was Y built this way, are we sure about Z. The deliverable is a cited answer, not a change. Do not build a sketch to answer a question you can answer by reading.

## Steps

1. **Name the question and the evidence standard.** What exactly is being asked, and what counts as an answer (a file, a call path, a documented decision, a commit, runtime behavior)? If the question is about behavior, the evidence standard includes running it.
2. **Read the real code, not the docs about the code.** Start from the actual implementation: the data shape, the call path, the boundary. Per **principle-model-the-domain**, understand the domain structure first; it explains most "why" questions.
3. **Run what is runnable.** If the answer is observable (behavior, timing, output, state), observe it. Reproduce before concluding, per **principle-fix-root-causes**.
4. **Seed from history and docs.** Regression history and decision records explain why the code is the way it is. Use the docs/ tree and git history; cite what you actually read.
5. **Fan out when wide.** Large surfaces (many files, multiple packages) go to parallel subagents; converge on the synthesis yourself. Guard the context window: keep summaries, not raw dumps.
6. **Write the cited answer.** Each claim maps to an artifact you read or observed this session. If the evidence is incomplete, say exactly what is missing rather than guessing.

## Reply

The answer up front, then the evidence trail (files, runs, commits) supporting it, then what remains uncertain. Name the principles that changed a decision.
