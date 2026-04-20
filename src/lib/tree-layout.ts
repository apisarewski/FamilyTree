import type { Node, Edge } from "reactflow";
import type { Person, Relationship } from "@/types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const H_GAP = 80;
const V_GAP = 120;

interface TreeNode {
  person: Person;
  generation: number;
  position: number;
}

function buildGenerationMap(
  persons: Person[],
  relationships: Relationship[]
): Map<string, number> {
  const genMap = new Map<string, number>();
  const childOf = new Map<string, string[]>();
  const parentOf = new Map<string, string[]>();

  for (const rel of relationships) {
    if (rel.type === "PARENT") {
      if (!childOf.has(rel.relatedPersonId)) childOf.set(rel.relatedPersonId, []);
      childOf.get(rel.relatedPersonId)!.push(rel.personId);
      if (!parentOf.has(rel.personId)) parentOf.set(rel.personId, []);
      parentOf.get(rel.personId)!.push(rel.relatedPersonId);
    }
  }

  const roots = persons.filter((p) => !parentOf.has(p.id) || parentOf.get(p.id)!.length === 0);

  const queue: { id: string; gen: number }[] = roots.map((r) => ({ id: r.id, gen: 0 }));
  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (genMap.has(id)) continue;
    genMap.set(id, gen);
    for (const childId of childOf.get(id) ?? []) {
      queue.push({ id: childId, gen: gen + 1 });
    }
  }

  for (const p of persons) {
    if (!genMap.has(p.id)) genMap.set(p.id, 0);
  }

  return genMap;
}

export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  if (persons.length === 0) return { nodes: [], edges: [] };

  const genMap = buildGenerationMap(persons, relationships);

  const byGen = new Map<number, string[]>();
  for (const [id, gen] of genMap.entries()) {
    if (!byGen.has(gen)) byGen.set(gen, []);
    byGen.get(gen)!.push(id);
  }

  const posMap = new Map<string, { x: number; y: number }>();
  for (const [gen, ids] of byGen.entries()) {
    ids.forEach((id, idx) => {
      posMap.set(id, {
        x: idx * (NODE_WIDTH + H_GAP),
        y: gen * (NODE_HEIGHT + V_GAP),
      });
    });
  }

  const nodes: Node[] = persons.map((p) => ({
    id: p.id,
    type: "personNode",
    position: posMap.get(p.id) ?? { x: 0, y: 0 },
    data: { person: p },
  }));

  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const rel of relationships) {
    const edgeId = `${rel.personId}-${rel.relatedPersonId}-${rel.type}`;
    if (seen.has(edgeId)) continue;
    seen.add(edgeId);

    if (rel.type === "PARENT") {
      edges.push({
        id: edgeId,
        source: rel.relatedPersonId,
        target: rel.personId,
        type: "smoothstep",
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
    } else if (rel.type === "PARTNER") {
      edges.push({
        id: edgeId,
        source: rel.personId,
        target: rel.relatedPersonId,
        type: "straight",
        style: { stroke: "#ec4899", strokeWidth: 2, strokeDasharray: "5,5" },
        animated: false,
      });
    }
  }

  return { nodes, edges };
}
