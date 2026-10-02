import { LitElement, html, css } from 'lit';
import { getContent } from '../content';
import { threadSequence, neighbourInSequence } from '../thread';
import './satyrn-companion';
import { createInitialState } from '../store/state';
import type { MechanicContext, MechanicElement } from '../mechanics/context';
import './satyrn-dialogue';
import type { Mechanic, World } from '../../tools/content/schema';
import type { Store } from '../store/store';

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
    .thread-nav {
      margin-block-start: 1rem;
      padding-block-start: 0.75rem;
      border-block-start: 1px solid var(--satyrn-charcoal, #383330);
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: baseline;
    }
    .thread-nav a {
      text-decoration: none;
      color: var(--satyrn-yellow-dark, #433715);
    }
    .thread-nav .next {
      font-weight: 600;
    }
    .complete {
      font-style: italic;
    }
  `;

  static properties = { worldId: {}, store: { attribute: false }, mode: {}, openDialogue: { attribute: false } };
  declare worldId: string;
  declare store?: Store;
  declare mode: 'thread' | 'wander';
  declare openDialogue?: string;

  private lastEnteredWorld?: string;
  private mountedMechanic?: MechanicElement;

  constructor() {
    super();
    this.worldId = '';
    this.mode = 'wander';
  }

  protected willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('worldId')) {
      this.mountedMechanic = undefined;
      this.openDialogue = undefined;
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
      dialogue: { open: (id) => this.openDialogueById(id) },
    };
  }

  private openDialogueById(id: string): void {
    this.openDialogue = id;
    this.requestUpdate();
  }

  private renderDialogue(content: ReturnType<typeof getContent>) {
    const id = this.openDialogue ?? (this.worldId ? content.worlds[this.worldId]?.dialogue : undefined);
    if (!id || !content.dialogues[id]) return null;
    return html`<satyrn-dialogue
      .dialogueId=${id}
      .state=${this.store?.getState() ?? createInitialState()}
    ></satyrn-dialogue>`;
  }

  protected updated(): void {
    const content = getContent();
    const world = content.worlds[this.worldId];
    if (!world) return;
    if (this.lastEnteredWorld !== this.worldId) {
      this.lastEnteredWorld = this.worldId;
      this.store?.dispatch({ type: 'world.entered', world: this.worldId });
    }
    if (this.mountedMechanic) return;
    const mechanic = content.mechanics[world.mechanic];
    const tag = mechanic?.element;
    if (!tag || !customElements.get(tag)) return;
    const holder = this.renderRoot.querySelector('[data-mechanic]');
    if (!holder) return;
    const element = document.createElement(tag) as MechanicElement;
    element.setContext(this.buildContext(world, mechanic));
    holder.replaceChildren(element);
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
      ${this.renderDialogue(content)}
      <satyrn-companion .line=${mechanic?.description ?? world.summary}></satyrn-companion>
      <nav>
        ${world.concepts.map(
          (id) => html`<a href="#/concept/${id}">${content.concepts[id]?.term ?? id}</a>&nbsp;`,
        )}
      </nav>
      ${registered ? html`<div data-mechanic></div>` : this.placeholder(world)}
      ${this.renderFooter(content, world.id)}
    `;
  }

  private renderFooter(content: ReturnType<typeof getContent>, worldId: string) {
    const ui = content.strings['strings.ui']?.values ?? {};
    if (this.mode !== 'thread') {
      return html`<nav class="thread-nav"><a href="#/">${ui.backToMap ?? 'Back to the map'}</a></nav>`;
    }
    const next = neighbourInSequence(threadSequence(content), worldId);
    return html`
      <nav class="thread-nav">
        ${next
          ? html`<a class="next" data-next-bead href="#/world/${next}">
              ${ui.threadContinue ?? 'Continue the Thread'} → ${content.worlds[next]?.title ?? next}
            </a>`
          : html`<span class="complete">${ui.threadComplete ?? 'You have walked the whole Thread.'}</span>`}
        <a href="#/">${ui.backToThread ?? 'Back to the Thread'}</a>
      </nav>
    `;
  }
}

customElements.define('satyrn-world', SatyrnWorld);