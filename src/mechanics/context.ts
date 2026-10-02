import { LitElement, html, type TemplateResult } from 'lit';
import type { Character, Concept, Mechanic, World } from '../../tools/content/schema';
import type { GameState, StoreEvent } from '../store/state';

export interface ContentReadApi {
  getConcept(id: string): Concept | undefined;
  getCharacter(id: string): Character | undefined;
}

export interface StoreReadApi {
  getState(): Readonly<GameState>;
  subscribe(fn: (state: GameState) => void): () => void;
  dispatch(event: StoreEvent): void;
}

export interface DialogueApi {
  open(dialogueId: string): void;
}

/** Everything a mechanic may read, plus the two ways it may act (dispatch, dialogue). */
export interface MechanicContext {
  mechanic: Mechanic;
  world: World;
  content: ContentReadApi;
  store: StoreReadApi;
  dialogue: DialogueApi;
}

/**
 * The swappable unit. A mechanic owns its styles, imports nothing from another
 * mechanic, emits typed events, and must provide an accessible path (a fallback
 * description plus a "continue without playing" control).
 */
export abstract class MechanicElement extends LitElement {
  /** Screen-reader description of the mechanic's puzzle. */
  static accessibilityDescription = '';

  protected context?: MechanicContext;

  setContext(context: MechanicContext): void {
    this.context = context;
    this.requestUpdate();
  }

  protected emitProgress(value: number): void {
    if (!this.context) return;
    this.context.store.dispatch({ type: 'mechanic.progress', mechanic: this.context.mechanic.id, value });
  }

  protected emitComplete(): void {
    if (!this.context) return;
    this.context.store.dispatch({
      type: 'mechanic.completed',
      mechanic: this.context.mechanic.id,
      world: this.context.world.id,
    });
  }

  protected emitEvidence(evidence: unknown): void {
    if (!this.context) return;
    this.context.store.dispatch({ type: 'evidence.submitted', mechanic: this.context.mechanic.id, evidence });
  }

  /** The accessible, non-interactive description of what this mechanic asks. */
  abstract renderFallback(): TemplateResult;

  /** The description plus the universal "continue without playing" control. */
  protected renderAccessibleShell(): TemplateResult {
    return html`
      <div class="fallback">
        ${this.renderFallback()}
        <button type="button" data-fallback @click=${() => this.useFallback()}>Continue without playing</button>
      </div>
    `;
  }

  protected useFallback(): void {
    this.emitComplete();
    this.emitEvidence({ usedFallback: true });
  }
}