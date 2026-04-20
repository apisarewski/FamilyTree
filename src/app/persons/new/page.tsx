import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PersonForm } from "@/components/forms/PersonForm";
import { canEdit } from "@/lib/utils";

export default async function NewPersonPage() {
  const session = await auth();
  if (!canEdit(session?.user.role)) redirect("/dashboard");

  const rawPersons = await prisma.person.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const persons = rawPersons.map((p) => ({
    ...p,
    birthDate: p.birthDate?.toISOString() ?? null,
    deathDate: p.deathDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nouvelle personne</h1>
      <PersonForm persons={persons} />
    </div>
  );
}
