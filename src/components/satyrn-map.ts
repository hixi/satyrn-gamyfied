import { LitElement, html, css } from 'lit';
import { getContent } from '../content';

/** The map of Beads, grouped by act and ordered within it. */
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
  `;

  static properties = { store: { attribute: false } };
  declare store?: { getState(): { visitedWorlds: string[] } };

  render() {
    const content = getContent();
    const visited = new Set(this.store?.getState().visitedWorlds ?? []);
    const acts: Array<'prologue' | 'act1' | 'act2' | 'act3'> = ['prologue', 'act1', 'act2', 'act3'];
    const labels: Record<string, string> = {
      prologue: 'Prologue',
      act1: 'Act I — The Making',
      act2: 'Act II — The Snags',
      act3: 'Act III — The Method and the Commons',
    };
    return html`
      <h2>${content.strings['strings.ui']?.values.mapHeading ?? 'The Thread'}</h2>
      ${acts.map((act) => {
        const worlds = Object.values(content.worlds)
          .filter((w) => w.act === act)
          .sort((a, b) => a.order - b.order);
        if (!worlds.length) return null;
        return html`
          <section>
            <h3>${labels[act]}</h3>
            <ul>
              ${worlds.map(
                (world) => html`
                  <li>
                    <a href="#/world/${world.id}" data-visited=${visited.has(world.id) ? 'true' : 'false'}>
                      ${world.title}
                    </a>
                  </li>
                `,
              )}
            </ul>
          </section>
        `;
      })}
    `;
  }
}

customElements.define('satyrn-map', SatyrnMap);