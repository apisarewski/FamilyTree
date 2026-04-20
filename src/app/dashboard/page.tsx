import { FamilyTree } from "@/components/tree/FamilyTree";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { canEdit } from "@/lib/utils";

async function getTreeData() {
  try {
    const [persons, relationships] = await Promise.all([
      prisma.person.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.relationship.findMany(),
    ]);
    return {
      persons: persons.map((p) => ({
        ...p,
        birthDate: p.birthDate?.toISOString() ?? null,
        deathDate: p.deathDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      relationships: relationships.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch {
    return { persons: [], relationships: [] };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const { persons, relationships } = await getTreeData();
  const editor = canEdit(session?.user.role);

  return (
    <div className="flex flex-col flex-1">
      {editor && persons.length === 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
          <p className="text-indigo-700 text-sm">
            L&apos;arbre est vide. Commencez par ajouter des personnes.
          </p>
          <Link
            href="/persons/new"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Ajouter une personne
          </Link>
        </div>
      )}
      <FamilyTree persons={persons} relationships={relationships} />
    </div>
  );
}
