import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';

interface Spot {
  id: string;
  label: string;
  x: number;
  y: number;
}

const SPOTS: Spot[] = [
  { id: 'bench', label: 'the workbench', x: 22, y: 24 },
  { id: 'shelf', label: 'the shelf', x: 78, y: 22 },
  { id: 'hearth', label: 'the hearth', x: 24, y: 78 },
  { id: 'door', label: 'the door', x: 76, y: 76 },
];

/** The Prologue: direct a lantern through a dark room and light what you attend to. */
export class MechanicLantern extends MechanicElement {
  static accessibilityDescription =
    'A dark workshop with four places to light: the workbench, the shelf, the hearth, and the door.';

  static styles = css`
    :host {
      display: block;
    }
    .room {
      touch-action: none;
    }
    svg {
      inline-size: 100%;
      max-inline-size: 22rem;
      block-size: auto;
      background: #241f1b;
      border-radius: 0.5rem;
      display: block;
    }
    .glow {
      transition: transform 120ms ease-out;
      filter: blur(3px);
    }
    @media (prefers-reduced-motion: reduce) {
      .glow {
        transition: none;
      }
    }
    :host([data-reduced-motion]) .glow {
      transition: none;
    }
    .fallback {
      margin-block-start: 0.6rem;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.4rem;
      padding: 0.4rem 0.7rem;
      background: white;
      cursor: pointer;
    }
  `;

  static properties = {
    lit: { attribute: false },
    activeIndex: { attribute: false },
    lightX: { attribute: false },
    lightY: { attribute: false },
    completed: { attribute: false },
  };

  readonly requiredSpots = SPOTS;

  declare lit: string[];
  declare activeIndex: number;
  declare lightX: number;
  declare lightY: number;
  declare completed: boolean;

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.lightActive();
    }
  };

  constructor() {
    super();
    this.lit = [];
    this.activeIndex = 0;
    this.lightX = SPOTS[0].x;
    this.lightY = SPOTS[0].y;
    this.completed = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('tabindex', '0');
    this.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
  }

  protected updated(): void {
    // Reflect the persisted reduced-motion setting, alongside the CSS media query.
    this.toggleAttribute('data-reduced-motion', this.reducedMotion);
  }

  /** Place the lantern on a required spot. Exposed for the keyboard path and tests. */
  moveToSpot(index: number): void {
    const spot = SPOTS[index];
    if (!spot) return;
    this.activeIndex = index;
    this.lightX = spot.x;
    this.lightY = spot.y;
    this.requestUpdate();
  }

  private lightActive(): void {
    const spot = SPOTS[this.activeIndex];
    if (!spot || this.lit.includes(spot.id)) return;
    this.lit = [...this.lit, spot.id];
    this.emitProgress(this.lit.length / SPOTS.length);
    if (this.lit.length === SPOTS.length && !this.completed) {
      this.completed = true;
      this.emitEvidence({ spotsLit: [...this.lit], usedFallback: false });
      this.emitComplete();
    }
  }

  private nearestSpot(x: number, y: number): number {
    let best = 0;
    let bestDistance = Infinity;
    SPOTS.forEach((spot, index) => {
      const d = (spot.x - x) ** 2 + (spot.y - y) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = index;
      }
    });
    return best;
  }

  private onPointerMove(event: PointerEvent): void {
    const svg = this.renderRoot.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.lightX = x;
    this.lightY = y;
    this.activeIndex = this.nearestSpot(x, y);
  }

  renderFallback(): TemplateResult {
    return html`<p>Move the lantern to each of the four places and press Enter to light it.</p>`;
  }

  render(): TemplateResult {
    return html`
      <div
        class="room"
        role="application"
        aria-label=${MechanicLantern.accessibilityDescription}
        @pointermove=${(event: PointerEvent) => this.onPointerMove(event)}
        @pointerdown=${() => this.lightActive()}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          ${SPOTS.map(
            (spot) => html`
              <circle
                cx=${spot.x}
                cy=${spot.y}
                r="6"
                fill=${this.lit.includes(spot.id) ? '#e3d678' : '#4a4540'}
                stroke=${this.lit.includes(spot.id) ? '#fff6c9' : '#322d29'}
                stroke-width="1"
              ></circle>
            `,
          )}
          <circle class="glow" cx=${this.lightX} cy=${this.lightY} r="15" fill="rgba(227,214,120,0.30)"></circle>
        </svg>
      </div>
      <p>Lit ${this.lit.length} of ${SPOTS.length}.</p>
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-lantern', MechanicLantern);