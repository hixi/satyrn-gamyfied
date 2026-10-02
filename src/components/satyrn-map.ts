import { LitElement, html, css, type TemplateResult } from 'lit';
import { getContent } from '../content';
import { threadSequence, nextUnvisited } from '../thread';

type Mode = 'thread' | 'wander';

export class SatyrnMap extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    section {
      margin-block-end: 1.5rem;
    }
    h3 {
      margin: 0.5rem 0;
    }
    ul {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    a {
      display: block;
      padding: 0.75rem 1rem;
      border: 2px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.5rem;
      text-decoration: none;
      color: inherit;
      background: var(--satyrn-paper, #fbf7ef);
    }
    a[data-visited='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 25%, white);
    }
    li[data-next='true'] a {
      border-color: var(--satyrn-yellow-ui, #816928);
      border-width: 3px;
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 40%, white);
    }
    .narration {
      font-style: italic;
      margin-block: 0.25rem 0.75rem;
    }
    .progress {
      font-size: 0.9rem;
      color: var(--satyrn-yellow-dark, #433715);
    }
  `;

  static properties = { store: { attribute: false }, mode: {} };
  declare store?: { getState(): { visitedWorlds: string[] } };
  declare mode: Mode;

  constructor() {
    super();
    this.mode = 'wander';
  }

  render() {
    const content = getContent();
    const visited = new Set(this.store?.getState().visitedWorlds ?? []);
    return this.mode === 'thread' ? this.renderThread(content, visited) : this.renderWander(content, visited);
  }

  private worldLink(worldId: string, visited: Set<string>, next: boolean) {
    const content = getContent();
    const world = content.worlds[worldId];
    if (!world) return null;
    return html`
      <li data-next=${next ? 'true' : 'false'}>
        <a href="#/world/${world.id}" data-visited=${visited.has(world.id) ? 'true' : 'false'}>${world.title}</a>
      </li>
    `;
  }

  private renderThread(content: ReturnType<typeof getContent>, visited: Set<string>): TemplateResult {
    const ui = content.strings['strings.ui']?.values ?? {};
    const sequence = threadSequence(content);
    const next = nextUnvisited(sequence, [...visited]);
    return html`
      <h2>${ui.mapHeading ?? 'The Thread'}</h2>
      <p class="narration">${ui.threadNarration ?? ''}</p>
      <p class="progress">${visited.size} of ${sequence.length} Beads walked.</p>
      ${next
        ? html`<p><a class="continue" href="#/world/${next}">${ui.threadContinue ?? 'Continue the Thread'}</a></p>`
        : html`<p class="progress">${ui.threadComplete ?? 'You have walked the whole Thread.'}</p>`}
      <ul>
        ${sequence.map((id) => this.worldLink(id, visited, id === next))}
      </ul>
    `;
  }

  private renderWander(content: ReturnType<typeof getContent>, visited: Set<string>): TemplateResult {
    const ui = content.strings['strings.ui']?.values ?? {};
    const acts: Array<'prologue' | 'act1' | 'act2' | 'act3'> = ['prologue', 'act1', 'act2', 'act3'];
    const labels: Record<string, string> = {
      prologue: 'Prologue',
      act1: 'Act I — The Making',
      act2: 'Act II — The Snags',
      act3: 'Act III — The Method and the Commons',
    };
    return html`
      <h2>${ui.wanderHeading ?? 'All the Beads'}</h2>
      ${acts.map((act) => {
        const worlds = Object.values(content.worlds)
          .filter((w) => w.act === act)
          .sort((a, b) => a.order - b.order);
        if (!worlds.length) return null;
        return html`
          <section>
            <h3>${labels[act]}</h3>
            <ul>
              ${worlds.map((world) => this.worldLink(world.id, visited, false))}
            </ul>
          </section>
        `;
      })}
    `;
  }
}

customElements.define('satyrn-map', SatyrnMap);