import { LitElement, html, css } from 'lit';
import { getContent } from '../content';
import './satyrn-companion';
import { createInitialState } from '../store/state';
import type { MechanicContext, MechanicElement } from '../mechanics/context';
import type { Mechanic, World } from '../../tools/content/schema';
import type { Store } from '../store/store';

/** One Bead: its keeper, its ideas, and its mechanic (or an accessible placeholder). */
export class SatyrnWorld extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .placeholder {
      border: 1px dashed var(--satyrn-charcoal, #383330);
      border-radius: 0.5rem;
      padding: 1rem;
    }
    button {
      font: inherit;
      padding: 0.5rem 0.9rem;
      border: 2px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.4rem;
      background: var(--satyrn-yellow, #e3d678);
      cursor: pointer;
    }
  `;

  static properties = { worldId: {}, store: { attribute: false } };
  declare worldId: string;
  declare store?: Store;

  private announced = false;
  private mountedMechanic?: MechanicElement;

  constructor() {
    super();
    this.worldId = '';
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.announced && this.worldId && this.store) {
      this.announced = true;
      this.store.dispatch({ type: 'world.entered', world: this.worldId });
    }
  }

  private placeholder(world: World) {
    const content = getContent();
    const message = content.strings['strings.ui']?.values.notInstalled ?? 'This mechanic is not installed — you can continue.';
    return html`
      <div class="placeholder">
        <p>${message}</p>
        <button type="button" data-continue @click=${() => this.continueWithoutPlaying(world)}>
          ${content.strings['strings.ui']?.values.continueWithoutPlaying ?? 'Continue without playing'}
        </button>
      </div>
    `;
  }

  private continueWithoutPlaying(world: World): void {
    this.store?.dispatch({ type: 'world.skipped', world: world.id });
  }

  private buildContext(world: World, mechanic: Mechanic): MechanicContext {
    const content = getContent();
    const store = this.store;
    const fallbackState = createInitialState();
    return {
      mechanic,
      world,
      content: {
        getConcept: (id) => content.concepts[id],
        getCharacter: (id) => content.characters[id],
      },
      store: store
        ? {
            getState: () => store.getState(),
            subscribe: (fn) => store.subscribe(fn),
            dispatch: (event) => store.dispatch(event),
          }
        : {
            getState: () => fallbackState,
            subscribe: () => () => {},
            dispatch: () => {},
          },
      dialogue: { open: () => {} },
    };
  }

  protected updated(): void {
    if (this.mountedMechanic) return;
    const content = getContent();
    const world = content.worlds[this.worldId];
    if (!world) return;
    const mechanic = content.mechanics[world.mechanic];
    const tag = mechanic?.element;
    if (!tag || !customElements.get(tag)) return;
    const holder = this.renderRoot.querySelector('[data-mechanic]');
    if (!holder) return;
    const element = document.createElement(tag) as MechanicElement;
    element.setContext(this.buildContext(world, mechanic));
    holder.append(element);
    this.mountedMechanic = element;
  }

  render() {
    const content = getContent();
    const world = content.worlds[this.worldId];
    if (!world) return html`<p>World not found: ${this.worldId}</p>`;
    const keeper = world.keeper ? content.characters[world.keeper] : undefined;
    const mechanic = content.mechanics[world.mechanic];
    const tag = mechanic?.element;
    const registered = !!tag && !!customElements.get(tag);
    return html`
      <h2>${world.title}</h2>
      ${keeper ? html`<p><strong>${keeper.name}</strong> — ${keeper.description}</p>` : null}
      <p>${world.intro}</p>
      <satyrn-companion .line=${mechanic?.description ?? world.summary}></satyrn-companion>
      <nav>
        ${world.concepts.map(
          (id) => html`<a href="#/concept/${id}">${content.concepts[id]?.term ?? id}</a>&nbsp;`,
        )}
      </nav>
      ${registered ? html`<div data-mechanic></div>` : this.placeholder(world)}
    `;
  }
}

customElements.define('satyrn-world', SatyrnWorld);