# Contributing

This is a recipe, not a library. The most valuable contributions are **things you
measured** and **traps you hit**, not features.

## What's most wanted

1. **Contradicting evidence.** You measured something and got a different answer. Bring
   the `measure-out.json`, your machine and browser versions, and the URL or repo. We'll
   replace or qualify the claim. Numbers here are from one build on one machine and should
   be treated as provisional until someone else reproduces them.
2. **New lessons.** A trap that cost you a day. Format below.
3. **Vernacular examples.** A subject → visual-language pairing that isn't in the Step 1
   table, ideally with a link to a page you built using it.
4. **Starter variants.** The same architecture in React/Next, Astro, Svelte, or with an
   SVG or 2D-canvas signature instead of WebGL. Keep them dependency-light and keep the
   `?p=` / `?ss=` debug hooks — they're the point.
5. **Accessibility corrections.** If a pattern here breaks screen readers, keyboard
   navigation, or vestibular safety, that's a bug and it outranks the aesthetics.

## What's not wanted

- Adding a framework to the starter.
- A component library. The recipe argues that reusable components are what makes sites
  read as templated; a component library would undercut the whole thing.
- Effects for their own sake. If it doesn't encode something true, it's not in scope.

## Format for a new lesson

Add it to `LESSONS.md` under the right heading, following the existing shape:

```markdown
### N. One-line statement of the rule

What happened, in two or three sentences. The mechanism — *why* it happens, not just that
it does. What to do instead, with code if code is shorter than prose.

**Evidence:** the measurement, the tool, and the machine — or "reasoned, not measured" if
that's the honest answer.
```

Be explicit about the difference between *measured* and *believed*. A confidently stated
guess is worse than nothing here, because the next person will build on it.

## Style

- Plain, specific prose. No marketing voice, no hype adjectives, no em-dash-and-exclaim.
- Prefer a code block to a paragraph when the code is shorter.
- Wrap at ~90 columns to keep diffs readable.
- One idea per section. If a section needs sub-bullets to stay coherent, it's two sections.

## Pull requests

- One lesson, one fix, or one variant per PR.
- If you change a number, say where the new number came from in the PR description.
- If you disagree with a taste claim, open an issue and argue it rather than silently
  softening the text — the rules are deliberately blunt, and a good argument for changing
  one is more useful than a hedge.

## Licence

MIT, same as the repo. By contributing you agree your contribution ships under it.
