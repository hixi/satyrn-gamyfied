import { LitElement, html, css } from 'lit';
import { getContent } from '../content';
import { matchesCondition } from '../store/achievements';
import type { GameState, StoreEvent } from '../store/state';
import type { DialogueChoice } from '../../tools/content/schema';

/** An event that matches no leaf; choice conditions are read from state alone. */
const NO_MATCHING_EVENT: StoreEvent = { type: 'world.entered', world: '\u0000none' };

export class SatyrnDialogue extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: 2px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.6rem;
      padding: 0.9rem 1rem;
      background: color-mix(in srgb, var(--satyrn-greige, #efe4d2) 60%, white);
    }
    .speaker {
      font-family: var(--satyrn-font-display, serif);
      font-size: 1.05rem;
      margin: 0 0 0.3rem;
    }
    ul {
      list-style: none;
      margin: 0.75rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
    }
    button {
      font: inherit;
      text-align: start;
      padding: 0.45rem 0.7rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.4rem;
      background: white;
      cursor: pointer;
    }
  `;

  static properties = {
    dialogueId: {},
    state: { attribute: false },
    nodeId: { attribute: false },
    onNode: { attribute: false },
  };
  declare dialogueId: string;
  declare state: GameState;
  declare nodeId: string;
  declare onNode?: (nodeId: string) => void;

  constructor() {
    super();
    this.dialogueId = '';
    this.nodeId = '';
  }

  willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('dialogueId')) {
      const dialogue = getContent().dialogues[this.dialogueId];
      this.nodeId = dialogue?.start ?? '';
    }
  }

  private choose(choice: DialogueChoice): void {
    if (choice.next) this.nodeId = choice.next;
    this.onNode?.(this.nodeId);
  }

  render() {
    const dialogue = getContent().dialogues[this.dialogueId];
    if (!dialogue) return html`<p>Dialogue not found: ${this.dialogueId}</p>`;
    const node = dialogue.nodes[this.nodeId] ?? dialogue.nodes[dialogue.start];
    if (!node) return html`<p>Dialogue has no nodes.</p>`;
    const speaker = getContent().characters[node.speaker];
    const visible = node.choices.filter(
      (choice) => !choice.condition || matchesCondition(this.state, NO_MATCHING_EVENT, choice.condition),
    );
    return html`
      <p class="speaker">${speaker?.name ?? node.speaker}</p>
      <p>${node.text}</p>
      ${visible.length
        ? html`<ul>
            ${visible.map(
              (choice) => html`<li><button type="button" @click=${() => this.choose(choice)}>${choice.text}</button></li>`,
            )}
          </ul>`
        : null}
    `;
  }
}

customElements.define('satyrn-dialogue', SatyrnDialogue);