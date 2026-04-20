"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { PersonNode } from "./PersonNode";
import { buildTreeLayout } from "@/lib/tree-layout";
import type { Person, Relationship } from "@/types";

const nodeTypes: NodeTypes = { personNode: PersonNode };

interface FamilyTreeProps {
  persons: Person[];
  relationships: Relationship[];
}

function TreeInner({ persons, relationships }: FamilyTreeProps) {
  const { setCenter } = useReactFlow();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<Person | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { nodes, edges } = useMemo(
    () => buildTreeLayout(persons, relationships),
    [persons, relationships]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const query = search.toLowerCase().trim();
      if (!query) return;

      const found = persons.find(
        (p) =>
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query) ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(query)
      );

      if (found) {
        setSearchResult(found);
        setNotFound(false);
        const node = nodes.find((n) => n.id === found.id);
        if (node) {
          setCenter(node.position.x + 90, node.position.y + 40, {
            zoom: 1.5,
            duration: 800,
          });
        }
      } else {
        setNotFound(true);
        setSearchResult(null);
      }
    },
    [search, persons, nodes, setCenter]
  );

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-b px-4 py-2 flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-60">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setNotFound(false);
              setSearchResult(null);
            }}
            placeholder="Rechercher une personne..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700"
          >
            Chercher
          </button>
        </form>
        {searchResult && (
          <span className="text-sm text-green-600 font-medium">
            Centré sur : {searchResult.firstName} {searchResult.lastName}
          </span>
        )}
        {notFound && (
          <span className="text-sm text-red-500">Aucun résultat trouvé.</span>
        )}
        <span className="text-xs text-gray-400">{persons.length} personne(s)</span>
      </div>

      <div className="flex-1" style={{ height: "calc(100vh - 120px)" }}>
        {persons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-lg font-medium">Aucune personne dans l&apos;arbre</p>
            <p className="text-sm mt-1">Commencez par ajouter une personne.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="bottom-right"
          >
            <Background color="#e0e7ff" gap={20} />
            <Controls />
            <MiniMap
              nodeColor="#6366f1"
              maskColor="rgba(99,102,241,0.05)"
              style={{ background: "#f0f0ff" }}
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export function FamilyTree(props: FamilyTreeProps) {
  return (
    <ReactFlowProvider>
      <TreeInner {...props} />
    </ReactFlowProvider>
  );
}
