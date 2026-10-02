# Satyrn — The Thread

An interactive, browser-based learning game that brings the world of
[Satyrn](https://satyrn-ai.com) to life. You are the **Wayfarer**, walking a
thread between ten small handmade worlds. Each world holds a small system built
by its keeper — a cup that overflows, an aviary of mismatched birds, a cart that
will not stop — and you learn how it works by working with it.

The game takes the *spirit* of a traveller moving between tiny worlds — the
structure, not the story — and turns it into Satyrn's own fiction. It teaches AI
literacy first, then the Satyrn method, then the community.

- **Beginners** get one clear idea per world, in plain language, with no jargon
  barrier.
- **Intermediate players** get an idea worth thinking about: how a small local
  model loses its place, why evidence beats a flattering reading, and what it
  means to keep the human at the wheel.

## Play

No backend, no accounts, no network calls. Everything runs in the browser and
your progress stays in your own `localStorage`.

```sh
npm install
npm run dev
```

Then open the address Vite prints. For a production build:

```sh
npm run build      # strict content check, then bundle into dist/
npm run preview    # serve the built site
```

The repository ships a GitHub Actions workflow that deploys `dist/` to
**GitHub Pages** on every push to `main`
(`https://<owner>.github.io/<repo>/`). Routing is hash-based, so it needs no
server rewrite rules. The workflow builds only — the test suite, type check,
and e2e run locally (`npm run check`), not in CI. The build still runs the strict
content check, so a broken reference or an unsolvable scenario fails the deploy
rather than shipping.

## The world

| Act | Bead | Keeper | Idea |
|---|---|---|---|
| Prologue | **The Lantern Room** | the Satyrn | attention — what you light is all it knows |
| I — The Making | **The Rain-Gauge Terrace** | the Waterwarden | tokens and the context window |
| | **The Aviary of Whispers** | the Birdwright | models and taxonomy |
| | **The Cartwright's Yard** | the Cartwright | agents and harnesses |
| II — The Snags | **The Round Path** | the Miller | runaway loops |
| | **The Gate of Orders** | the Gatekeeper | instructions, constraints, ambiguity |
| | **The Assayer's Scale** | the Assayer | evaluation — evidence over vanity |
| III — The Method and the Commons | **The Blueprint and the Mason** | the Draughtswoman & the Mason | spec-driven development |
| | **The Well and the Pipe** | the Well-Digger | local vs cloud |
| | **The Commons Garden** | the Gardener | community and contribution |

Your companions are the **Satyrn** — the small local model, quick and curious
and easily distracted, the one you are learning to keep on track — and the
**Moon**, your journal and your counterweight, who asks how you could know
something is true.

Every world has its own mechanic: pour raindrops into a fixed cup, match birds
to errands, rig a cart so the horse arrives *and stops*, spot the mule's
repeating circle, write an order a literal gate will obey, refuse a scale that
cannot fail, turn a drawing into a spec, route the day between your own well and
a shared pipe, and plant a Bead of your own in the commons.

## Features

- **Ten worlds, ten distinct mechanics** — no two play the same way.
- **Freely selectable and skippable.** Every Bead is enterable at any time, and
  every mechanic has a *Continue without playing* path, so no one is ever stuck.
- **Keyboard-first.** Every mechanic is completable with the keyboard alone and
  declares a screen-reader description; any motion honours
  `prefers-reduced-motion`.
- **Achievements distinguish the three honest outcomes:** solving a world's
  lesson, skipping it with *Continue without playing* (recorded and
  acknowledged — and it does **not** grant the lesson), and completing the
  journey by planting a Bead in the commons.
- **Your progress is yours.** Versioned save state with migrations, plus
  export, import, and reset in the journal.
- **No accounts, no tracking, no ambient network.**

## How it is built

TypeScript, [Vite](https://vite.dev), and [Lit](https://lit.dev) web components.
No SPA framework; a small event-bus store and a hash router.

The design goal is that **every part is independently replaceable** — a world, a
mechanic, a concept, an achievement — and that the references between parts are
**checked automatically** rather than trusted.

- **Content is data.** Worlds, concepts, characters, achievements, and
  dialogues live as YAML under `content/`. Structure is typed; prose is
  schema-validated.
- **References are one-directional** (a world points at its concepts; a concept
  never points back), which forbids cycles and is what makes a part swappable.
- **A link checker resolves the whole graph** at build time: dangling
  references, duplicate ids, cycles, and unreachable worlds. In development it
  warns and the game shows a visible placeholder; in `build` it **fails hard**.
- **Every mechanic's scenario is validated at build time** against its own
  logic. A world whose puzzle is unsolvable — more essential drops than the cup
  holds, no check that can fail, an ambiguous order, sensitive needs past the
  well — fails the build. Each validator lives beside the mechanic and reuses
  its parser, so the check cannot drift from the mechanic itself.
- **Every mechanic implements one documented contract** (`MechanicElement`): it
  receives a read-only context, emits typed progress/complete/evidence events,
  owns its styles, imports no other mechanic, and must declare an accessible
  path. Adding a world is a content file plus one registry line.

```
content/     authored source of truth (YAML parts)
tools/       schema, loader, link checker, content build, Vite plugin
src/         app shell, store, router, components, mechanics/<id>/
  generated/ the content bundle, generated at build time (committed)
tests/       unit, content, mechanic, and Playwright e2e
docs/superpowers/  the design spec and the four wave plans
```

## Development

```sh
npm run dev           # content build + Vite dev server
npm run check:content # strict check: links, scenarios, and a stale bundle
npm run typecheck     # tsc --noEmit
npm test              # unit and component tests (Vitest + jsdom)
npm run e2e           # Playwright browser walk of every act
npm run check         # everything: content, typecheck, unit, build, e2e
```

The test suite proves the checks in both directions: broken fixtures (dangling,
duplicate, cycle, unreachable) must fail, and the good ones must pass. Every
mechanic is proven solvable by its own tests.

## Contributing a world

The parts model is designed for this. A new Bead is:

1. `content/worlds/<id>.yaml` (and its concepts, characters, dialogue,
   achievement, and mechanic `params`),
2. a Lit element in `src/mechanics/<id>/` implementing `MechanicElement`,
3. one `defineMechanic(...)` line in `src/mechanics/registry.ts`,
4. an entry in `content/threads/main.yaml`.

`npm run check` must be green. See the design spec in
[`docs/superpowers/specs/`](docs/superpowers/specs/) for the full architecture,
and the wave plans for how each act was built.

## License

Apache-2.0 — see [LICENSE](LICENSE). Copyright 2026 Nicola Jordan.