import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';
import { parseScenario, MAX_NAME_LENGTH, type CommunityBead, type Seed } from './scenario';

/** The Commons Garden: wander the commons, then plant a Bead of your own. */
export class MechanicGarden extends MechanicElement {
  static accessibilityDescription =
    'Visit a community Bead, type a name for your own Bead, choose a seed, and plant it in the garden.';

  static styles = css`
    :host {
      display: block;
    }
    ul {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
    }
    li {
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    li[data-visited='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
      background: color-mix(in srgb, var(--satyrn-yellow, #e3d678) 18%, white);
    }
    .about {
      display: block;
      font-size: 0.85rem;
    }
    .seeds {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-block: 0.5rem;
    }
    .planted {
      border-inline-start: 4px solid var(--satyrn-yellow, #e3d678);
      padding-inline-start: 0.7rem;
      margin-block-start: 0.7rem;
    }
    input {
      font: inherit;
      padding: 0.3rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
      padding: 0.25rem 0.6rem;
      background: white;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: var(--satyrn-yellow, #e3d678);
    }
  `;

  static properties = {
    seeds: { attribute: false },
    communityBeads: { attribute: false },
    name: { attribute: false },
    seed: { attribute: false },
    visited: { attribute: false },
    plantedName: { attribute: false },
    completed: { attribute: false },
  };

  declare seeds: Seed[];
  declare communityBeads: CommunityBead[];
  declare name: string;
  declare seed: string;
  declare visited: string[];
  declare plantedName: string;
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.seeds = scenario.seeds;
    this.communityBeads = scenario.communityBeads;
    this.name = '';
    this.seed = '';
    this.visited = [];
    this.plantedName = '';
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.seeds = scenario.seeds;
    this.communityBeads = scenario.communityBeads;
    this.name = '';
    this.seed = '';
    this.visited = [];
    this.plantedName = '';
    this.completed = false;
    super.setContext(context);
  }

  setName(value: string): void {
    this.name = value.slice(0, MAX_NAME_LENGTH);
    this.requestUpdate();
  }

  chooseSeed(seedId: string): void {
    if (!this.seeds.some((s) => s.id === seedId)) return;
    this.seed = seedId;
    this.requestUpdate();
  }

  visit(beadId: string): void {
    if (!this.communityBeads.some((b) => b.id === beadId)) return;
    if (!this.visited.includes(beadId)) this.visited = [...this.visited, beadId];
    this.emitProgress(this.visited.length ? 0.5 : 0);
    this.requestUpdate();
  }

  /** Plant a Bead. Needs a name, a seed, and at least one visit to the commons. */
  plant(): 'planted' | 'unnamed' | 'no-seed' {
    if (!this.name.trim()) return 'unnamed';
    if (!this.seed) return 'no-seed';
    this.plantedName = this.name.trim();
    if (this.visited.length > 0 && !this.completed) {
      this.completed = true;
      this.emitProgress(1);
      this.emitEvidence({ name: this.plantedName, seed: this.seed, visited: [...this.visited], usedFallback: false });
      this.emitComplete();
    }
    this.requestUpdate();
    return 'planted';
  }

  renderFallback(): TemplateResult {
    return html`<p>Visit a Bead from the commons, name your own, choose a seed, and plant it.</p>`;
  }

  render(): TemplateResult {
    return html`
      <h3>Beads others planted</h3>
      <ul>
        ${this.communityBeads.map(
          (bead) => html`
            <li data-visited=${this.visited.includes(bead.id) ? 'true' : 'false'}>
              <button type="button" @click=${() => this.visit(bead.id)}>${bead.name}</button>
              <span class="about">${this.visited.includes(bead.id) ? `by ${bead.keeper} — ${bead.about}` : 'not yet visited'}</span>
            </li>
          `,
        )}
      </ul>
      <h3>Your plot</h3>
      <label for="bead-name">Name your Bead</label>
      <input
        id="bead-name"
        type="text"
        maxlength=${MAX_NAME_LENGTH}
        .value=${this.name}
        @input=${(event: Event) => this.setName((event.target as HTMLInputElement).value)}
      />
      <div class="seeds">
        ${this.seeds.map(
          (seed) => html`<button
            type="button"
            aria-pressed=${this.seed === seed.id ? 'true' : 'false'}
            @click=${() => this.chooseSeed(seed.id)}
          >
            ${seed.name}
          </button>`,
        )}
      </div>
      <button type="button" @click=${() => this.plant()}>Plant your Bead</button>
      ${this.plantedName && this.completed
        ? html`<div class="planted">
            <strong>${this.plantedName}</strong> — planted. It stands with the others now, and the garden is one Bead larger.
          </div>`
        : null}
      ${this.plantedName && !this.completed
        ? html`<p class="planted">
            The Gardener waits. Wander one of the Beads above first, then plant <strong>${this.plantedName}</strong>.
          </p>`
        : null}
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-garden', MechanicGarden);