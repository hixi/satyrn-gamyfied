import { html, css, type TemplateResult } from 'lit';
import { MechanicElement } from '../context';

interface Bird {
  id: string;
  name: string;
  traits: string[];
}

interface Task {
  id: string;
  label: string;
  needs: string[];
}

const DEFAULT_BIRDS: Bird[] = [
  { id: 'swift', name: 'the swift wren', traits: ['swift', 'small'] },
  { id: 'patient', name: 'the patient heron', traits: ['patient', 'careful'] },
  { id: 'vast', name: 'the vast crane', traits: ['vast', 'careful'] },
];
const DEFAULT_TASKS: Task[] = [
  { id: 'many', label: 'carry many small messages quickly', needs: ['swift', 'small'] },
  { id: 'gentle', label: 'tend a fragile nest for hours', needs: ['patient', 'careful'] },
  { id: 'wide', label: 'survey the whole valley at once', needs: ['vast', 'careful'] },
];

function parseScenario(params: unknown): { birds: Bird[]; tasks: Task[] } {
  const raw = (params ?? {}) as { birds?: unknown; tasks?: unknown };
  const parseList = <T,>(value: unknown, fallback: T[], map: (item: Record<string, unknown>, i: number) => T): T[] => {
    if (!Array.isArray(value)) return fallback;
    const mapped = value
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map(map);
    return mapped.length ? mapped : fallback;
  };
  const birds = parseList<Bird>(raw.birds, DEFAULT_BIRDS, (b, i) => ({
    id: typeof b.id === 'string' && b.id ? b.id : `bird-${i}`,
    name: typeof b.name === 'string' && b.name ? b.name : `bird ${i + 1}`,
    traits: Array.isArray(b.traits) ? b.traits.filter((t): t is string => typeof t === 'string') : [],
  }));
  const tasks = parseList<Task>(raw.tasks, DEFAULT_TASKS, (t, i) => ({
    id: typeof t.id === 'string' && t.id ? t.id : `task-${i}`,
    label: typeof t.label === 'string' && t.label ? t.label : `task ${i + 1}`,
    needs: Array.isArray(t.needs) ? t.needs.filter((n): n is string => typeof n === 'string') : [],
  }));
  return { birds, tasks };
}

function uniqueMatchingTask(birds: Bird[], tasks: Task[]): Map<string, string> {
  const solved = new Map<string, string>();
  const used = new Set<string>();
  const tryAssign = (index: number): boolean => {
    if (index === tasks.length) return true;
    const task = tasks[index];
    for (const bird of birds) {
      if (used.has(bird.id)) continue;
      if (!task.needs.every((need) => bird.traits.includes(need))) continue;
      used.add(bird.id);
      solved.set(task.id, bird.id);
      if (tryAssign(index + 1)) return true;
      used.delete(bird.id);
      solved.delete(task.id);
    }
    return false;
  };
  return tryAssign(0) ? solved : new Map();
}

/** The Aviary: match each errand to a suitable bird, each bird lent only once. */
export class MechanicAviary extends MechanicElement {
  static accessibilityDescription =
    'Three errands and three birds. Assign each errand a bird that has every needed gift, using each bird at most once.';

  static styles = css`
    :host {
      display: block;
    }
    ul {
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    li {
      display: grid;
      gap: 0.3rem;
      padding: 0.5rem;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
    }
    li[data-satisfied='true'] {
      border-color: var(--satyrn-yellow-ui, #816928);
    }
    select {
      font: inherit;
      padding: 0.25rem;
    }
    .status {
      font-size: 0.85rem;
    }
    .conflict {
      color: #8a1f1f;
    }
    button {
      font: inherit;
      border: 1px solid var(--satyrn-charcoal, #383330);
      border-radius: 0.35rem;
      padding: 0.25rem 0.6rem;
      background: white;
      cursor: pointer;
    }
  `;

  static properties = {
    birds: { attribute: false },
    tasks: { attribute: false },
    assignments: { attribute: false },
    completed: { attribute: false },
  };

  declare birds: Bird[];
  declare tasks: Task[];
  declare assignments: Record<string, string>;
  declare completed: boolean;

  constructor() {
    super();
    const scenario = parseScenario(undefined);
    this.birds = scenario.birds;
    this.tasks = scenario.tasks;
    this.assignments = {};
    this.completed = false;
  }

  override setContext(context: Parameters<MechanicElement['setContext']>[0]): void {
    const scenario = parseScenario(context.mechanic.params);
    this.birds = scenario.birds;
    this.tasks = scenario.tasks;
    this.assignments = {};
    this.completed = false;
    super.setContext(context);
  }

  assign(taskId: string, birdId: string): void {
    if (this.completed) return;
    this.assignments = { ...this.assignments, [taskId]: birdId };
    this.emitProgress(this.satisfiedCount() / this.tasks.length);
    this.check();
    this.requestUpdate();
  }

  private satisfied(task: Task): boolean {
    const birdId = this.assignments[task.id];
    const bird = this.birds.find((b) => b.id === birdId);
    return !!bird && task.needs.every((need) => bird.traits.includes(need));
  }

  private satisfiedCount(): number {
    return this.tasks.filter((task) => this.satisfied(task)).length;
  }

  conflicts(): { taskIds: string[]; birdId: string }[] {
    const byBird = new Map<string, string[]>();
    for (const task of this.tasks) {
      const birdId = this.assignments[task.id];
      if (!birdId) continue;
      byBird.set(birdId, [...(byBird.get(birdId) ?? []), task.id]);
    }
    return [...byBird.entries()]
      .filter(([, taskIds]) => taskIds.length > 1)
      .map(([birdId, taskIds]) => ({ birdId, taskIds }));
  }

  private check(): void {
    const allAssigned = this.tasks.every((task) => this.assignments[task.id]);
    const allSatisfied = this.tasks.every((task) => this.satisfied(task));
    const noConflicts = this.conflicts().length === 0;
    if (allAssigned && allSatisfied && noConflicts && !this.completed) {
      this.completed = true;
      this.emitEvidence({ assignments: { ...this.assignments }, usedFallback: false });
      this.emitComplete();
    }
  }

  /** Assign each task a bird that fits, using the solver. Used by tests and the hint. */
  solve(): void {
    const solved = uniqueMatchingTask(this.birds, this.tasks);
    for (const [taskId, birdId] of solved) this.assignments[taskId] = birdId;
    this.emitProgress(this.satisfiedCount() / this.tasks.length);
    this.check();
    this.requestUpdate();
  }

  renderFallback(): TemplateResult {
    return html`<p>For each errand, choose a bird with every gift the errand needs.</p>`;
  }

  render(): TemplateResult {
    const conflicts = new Set(this.conflicts().flatMap((c) => c.taskIds));
    return html`
      <ul>
        ${this.tasks.map((task) => {
          const selected = this.assignments[task.id] ?? '';
          const satisfied = this.satisfied(task);
          const conflicted = conflicts.has(task.id);
          return html`
            <li data-satisfied=${satisfied && !conflicted ? 'true' : 'false'}>
              <label for=${`task-${task.id}`}>${task.label}</label>
              <select
                id=${`task-${task.id}`}
                .value=${selected}
                @change=${(event: Event) => this.assign(task.id, (event.target as HTMLSelectElement).value)}
              >
                <option value="">— choose a bird —</option>
                ${this.birds.map((bird) => html`<option value=${bird.id}>${bird.name}</option>`)}
              </select>
              <span class="status ${conflicted ? 'conflict' : ''}">
                ${conflicted ? 'that bird is already lent' : satisfied ? 'suited' : 'not yet suited'}
              </span>
            </li>
          `;
        })}
      </ul>
      <button type="button" @click=${() => this.solve()}>Show me a fitting</button>
      ${this.renderAccessibleShell()}
    `;
  }
}

customElements.define('mechanic-aviary', MechanicAviary);