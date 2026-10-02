import type { Condition, Content, DanglingRef, LinkDiagnostics } from './schema';

export class ContentCheckError extends Error {}

/** Resolve every reference in the content graph, collecting every miss. */
export function linkContent(content: Content): LinkDiagnostics {
  const dangling: DanglingRef[] = [];
  const conceptIds = new Set(Object.keys(content.concepts));
  const characterIds = new Set(Object.keys(content.characters));
  const worldIds = new Set(Object.keys(content.worlds));
  const mechanicIds = new Set(Object.keys(content.mechanics));

  const ref = (from: string, field: string, target: string, exists: boolean) => {
    if (!exists) dangling.push({ from, field, target });
  };

  const walkCondition = (from: string, field: string, condition: Condition) => {
    if ('all' in condition) {
      condition.all.forEach((c, i) => walkCondition(from, `${field}.all.${i}`, c));
    } else if ('any' in condition) {
      condition.any.forEach((c, i) => walkCondition(from, `${field}.any.${i}`, c));
    } else if ('not' in condition) {
      walkCondition(from, `${field}.not`, condition.not);
    } else {
      const world = 'world' in condition ? condition.world : undefined;
      const mechanic = 'mechanic' in condition ? condition.mechanic : undefined;
      if (world) ref(from, field, world, worldIds.has(world));
      if (mechanic) ref(from, field, mechanic, mechanicIds.has(mechanic));
    }
  };

  for (const world of Object.values(content.worlds)) {
    if (world.keeper) ref(world.id, 'keeper', world.keeper, characterIds.has(world.keeper));
    for (const concept of world.concepts) ref(world.id, 'concepts', concept, conceptIds.has(concept));
    ref(world.id, 'mechanic', world.mechanic, mechanicIds.has(world.mechanic));
    if (world.engineRoom?.mechanic) {
      ref(world.id, 'engineRoom.mechanic', world.engineRoom.mechanic, mechanicIds.has(world.engineRoom.mechanic));
    }
  }

  for (const concept of Object.values(content.concepts)) {
    for (const related of concept.related) ref(concept.id, 'related', related, conceptIds.has(related));
  }

  for (const dialogue of Object.values(content.dialogues)) {
    for (const node of Object.values(dialogue.nodes)) {
      ref(dialogue.id, `nodes.${node.id}.speaker`, node.speaker, characterIds.has(node.speaker));
      for (const choice of node.choices) {
        if (choice.next) {
          ref(dialogue.id, `nodes.${node.id}.choices.${choice.id}.next`, choice.next, choice.next in dialogue.nodes);
        }
        if (choice.condition) {
          walkCondition(dialogue.id, `nodes.${node.id}.choices.${choice.id}.condition`, choice.condition);
        }
      }
    }
  }

  for (const achievement of Object.values(content.achievements)) {
    if (achievement.condition) walkCondition(achievement.id, 'condition', achievement.condition);
  }

  for (const thread of Object.values(content.threads)) {
    for (const world of thread.sequence) ref(thread.id, 'sequence', world, worldIds.has(world));
  }

  return { dangling };
}

function findConceptCycle(content: Content): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    if (visiting.has(id)) return [...stack.slice(stack.indexOf(id)), id];
    if (visited.has(id)) return null;
    visiting.add(id);
    stack.push(id);
    for (const next of content.concepts[id]?.related ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const id of Object.keys(content.concepts)) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
}

/** Strict check: any dangling reference, cycle, or unreachable world throws. */
export function checkContent(content: Content): void {
  const problems: string[] = [];
  for (const ref of linkContent(content).dangling) {
    problems.push(`dangling reference from ${ref.from} (${ref.field}) to ${ref.target}`);
  }

  const cycle = findConceptCycle(content);
  if (cycle) problems.push(`concept reference cycle: ${cycle.join(' -> ')}`);

  const inThread = new Set<string>();
  for (const thread of Object.values(content.threads)) {
    for (const world of thread.sequence) inThread.add(world);
  }
  const unreachable = Object.keys(content.worlds).filter((world) => !inThread.has(world));
  if (unreachable.length) {
    problems.push(`unreachable worlds (absent from every thread): ${unreachable.join(', ')}`);
  }

  if (problems.length) throw new ContentCheckError(problems.join('\n'));
}