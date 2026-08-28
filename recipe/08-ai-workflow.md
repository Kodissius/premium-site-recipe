# Working with an AI coding agent

Optional. The recipe stands on its own if you're writing every line yourself. But this site
was built with an agent, and most of what made that work is not obvious.

Applies to any agentic coding tool that can read files, write files, and run commands.

---

## The core problem

An agent asked to "build a premium animated site" produces the banned list. Not because
it's bad at design, but because the defaults are what the world's tutorials and templates
are made of, and "premium" is not a specification.

Everything below is machinery for replacing "premium" with something checkable.

## 1. The brief is the contract

Write `DESIGN.md` first — [brief-template.md](brief-template.md) — and make it the thing
the agent is held to. Tokens, structure, copy rules, banned list.

Then the review question stops being "do I like this?" and becomes "does this match the
brief?" That difference is most of the value. It also gives you a way to reject work
without relitigating taste every time, and it survives context loss — a new session reads
the brief and knows the rules.

Put the banned list in it verbatim. Agents follow explicit prohibitions well and infer
implicit taste badly.

## 2. Give the agent eyes

**This is the highest-leverage thing on the page.** An agent that cannot see the page it
is building is guessing. The `?p=` and `?ss=` hooks from
[05-verify.md](05-verify.md), plus a screenshot script, turn a guessing loop into a
feedback loop:

```
agent edits scene.js → runs shots.mjs → looks at 11 PNGs → sees beat 4 is dead → fixes it
```

Without deterministic frame addressing, none of that works. The purity of `apply(p)` is
what makes it possible, which is why it's an architectural rule rather than a preference.

Same for performance: give the agent `measure.mjs` and it can optimize against numbers
instead of vibes.

## 3. Scope tasks to one beat, one section, or one bug

"Build the hero" produces something you'll rewrite. "Add beat 4 to `SEG` between 0.55 and
0.75, in which the detail changes shape as a result of the analysis; camera stays on the
detail rig; nothing else moves" produces something you can review in a contact sheet.

The `SEG` map makes this natural — a beat is a genuinely independent unit of work.

## 4. Run bake-offs for the signature

Two agents, same brief, different output files. Then shoot both contact sheets at identical
progress values and compare frames.

This works better than iterating one attempt because:

- The choice becomes visual and side-by-side instead of argumentative.
- The loser usually contributes two or three ideas worth grafting into the winner.
- Different models make genuinely different choices; you learn what the design space looks
  like rather than what one path through it looks like.

Archive the loser. Ours got raided for parts weeks later.

## 5. Keep a running handoff document

Agent sessions end. Context is lost. Keep one file — call it `HANDOFF.md` — recording:

- What changed this session and why
- Decisions the owner made, especially the ones that reversed earlier work
- Traps discovered, so nobody rediscovers them
- Current state: what's live, what's broken, what's next

It is worth more than any amount of clever prompting. Most of [LESSONS.md](../LESSONS.md)
came out of one, and re-solving a solved problem is the most common way agent-assisted
projects waste days.

## 6. Do not let an agent invent facts

The strictest rule on the whole project, and it's a content rule rather than a technical
one.

Agents produce plausible specifics — figures, percentages, dates, credentials — because
plausible specifics are what the surrounding text looks like. On a page whose entire job is
credibility, one invented number is fatal.

- Name a **single source of truth** file for factual claims and require the page to mirror
  it.
- Default to cutting any specific figure that doesn't trace to that file.
- Label illustrative numbers on screen as illustrative.
- Review copy separately from code, with the source of truth open.

## 7. Practical operating notes

- **A killed or stalled agent can usually be resumed** rather than restarted — check
  whether the target file's modification time and size indicate real progress before
  throwing work away.
- **If one model keeps failing on a task, try another.** Different models fail at different
  things; a task that one stalls on repeatedly often completes first try elsewhere.
- **Check the work, not the description of the work.** Read the diff. Run the screenshots.
  Agents report success accurately far more often than not, but the failure mode —
  confident summary of work that didn't land — is expensive and silent.
- **Ask for the mechanism, not just the fix.** "Why did that happen?" turns a patch into a
  lesson, and lessons are what stop the same bug reappearing in a different beat.
- **One change per measurement.** Same rule as any performance work; agents will happily
  make six changes at once and you'll learn nothing.

## 8. What agents are genuinely good at here

- Parametric geometry — the arithmetic of a procedural 3D object is tedious and exacting,
  and it's a real strength.
- Retiming and refactoring against a `SEG` map — mechanical, well-specified, verifiable.
- Performance audits given a measurement script and a budget.
- Writing the tooling (screenshot rigs, measurement scripts) rather than the design.
- Systematically applying a token or a rule across a whole file.

## 9. What they're not

- Deciding the thesis. That's the one thing you can't delegate — the "what is true about
  this subject" question is upstream of everything and it's yours.
- Judging whether a frame is beautiful. They'll tell you it looks good. Look at it.
- Knowing when to stop. Left running, an agent adds. The banned list and the brief are what
  push back.
