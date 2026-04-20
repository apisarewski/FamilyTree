"use client";

import { Handle, Position } from "reactflow";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { Person } from "@/types";

interface PersonNodeData {
  person: Person;
}

export function PersonNode({ data }: { data: PersonNodeData }) {
  const router = useRouter();
  const { person } = data;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-indigo-400" />
      <div
        onClick={() => router.push(`/persons/${person.id}`)}
        className="bg-white border-2 border-indigo-200 rounded-xl px-4 py-3 shadow-md hover:shadow-lg hover:border-indigo-400 cursor-pointer transition-all w-44 select-none"
      >
        <p className="font-semibold text-gray-900 text-sm truncate">
          {person.firstName} {person.lastName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {person.birthDate ? formatDate(person.birthDate) : "n.d."}
          {person.deathDate ? ` — ${formatDate(person.deathDate)}` : ""}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400" />
    </>
  );
}
