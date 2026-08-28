# Step 8 — The banned list

The most useful page in this repo, and the least technical.

---

## Why a banned list at all

Every generator, template, and tutorial converges on the same small vocabulary of effects.
They're not bad effects. They're *recognizable* ones — and recognition is the opposite of
premium. A page using three of them reads as generic no matter how well each is executed,
because a visitor has seen that exact combination fifty times.

A banned list turns "this feels generic" from a taste argument into a checkable rule. That
matters most when you're working with a collaborator or an AI agent, both of which will
otherwise reach for the defaults, because the defaults are what the training data and the
tutorials are full of.

---

## Our list

Adapt it. Don't copy it.

| Banned | Why |
|---|---|
| Particle fields / floating dots | The single most common "premium" default; encodes nothing |
| Purple/violet gradients | The house style of a decade of templates |
| Tilted or rotated cards | Reads as decoration pretending to be dynamism |
| Custom cursors | Breaks a platform affordance for an effect nobody asked for |
| Preloader percentage counters | Fake work. If the page is fast you don't need one; if it's slow, fix the page |
| Per-letter text splits | Immediately legible as a library effect |
| Glassmorphism / backdrop-blur | Unreadable over busy backgrounds, expensive to composite |
| Border-radius > 3 px | Soft corners read as SaaS template; precision reads as considered |
| More than one kinetic-type moment | The second cancels the first |
| Decorative 3D beyond the one signature | Two rendered objects read as a template; one reads as craft |
| Autoplaying video backgrounds | Bandwidth, battery, and it competes with your signature |
| Scroll-jacked "slides" | Removes the user's control of their own scroll |
| Marquee text strips | Motion with zero information content |
| Fake terminal typing effects | Unless your subject *is* a terminal, and then it must type something true |

## The rule underneath all of them

> **Every decorative device must encode something true.**

This is the actual test. Everything in the table is downstream of it.

Apply it to any element you're unsure about: *what does this tell the viewer that's true
about the subject?* If the answer is "nothing, it looks nice," delete it. If the answer is
"it shows the revision number, and this is revision 6," keep it.

The constraint is generative, not restrictive. Forcing every ornament to carry information
produces details you would never have invented from "make it look designed" — numbered
sheets, real timestamps, a status line that reflects an actual state, a caption that
describes the actual image. Those details are what make a page feel like it came from
inside the subject rather than from a marketplace.

---

## Writing your own

Three questions:

1. **What have I seen on twenty sites in this space?** That's your ban list. It's specific
   to your field, and it's usually obvious once you look at competitors back to back.
2. **What does my vernacular forbid?** An engineering-drawing vernacular can't have soft
   gradients — drawings don't have them. A lab-notebook vernacular can't have a hero video.
   The vernacular writes half the list for you.
3. **What am I reaching for because it's easy?** Those are the ones to interrogate. Ease
   of implementation and quality of outcome are unrelated, and effects that are one library
   call away are the ones everyone else also made in one library call.

Keep the list in your brief. Reference it in review. When a collaborator or an agent
produces something that violates it, cite the line rather than arguing taste.

---

## The inversions

Every ban is only a ban in a context. If your subject genuinely *is* particles — a physics
group, a cosmology project, an aerosol company — then a particle field encodes something
true and belongs. If your vernacular is soft (childcare, skincare, hospitality), cap your
radius high rather than low and hold *that* consistently.

The rule isn't "be austere." It's **be consistent, and let every device mean something**.
A maximalist page where every excess is motivated beats a restrained page where the
restraint is unmotivated.

---

## Reviewing against the list

A pass that takes ten minutes and catches most drift:

- [ ] Screenshot the page at four scroll positions. For each visible ornament, name what it
      encodes. Anything you can't answer for is a deletion candidate.
- [ ] `grep` the CSS for `border-radius`, `blur(`, `rotate(`, `gradient` — every hit should
      be justifiable by the brief.
- [ ] Count kinetic-type moments. Should be one.
- [ ] Count rendered/decorative 3D objects. Should be one, or zero.
- [ ] Read every line of copy aloud. Anything that sounds like marketing gets cut or made
      specific.
- [ ] Check the accent color count: how many distinct places does it appear? If more than
      three or four kinds of place, it's a color scheme, not a signature.
