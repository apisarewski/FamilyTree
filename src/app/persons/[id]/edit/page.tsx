import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PersonForm } from "@/components/forms/PersonForm";
import { canEdit } from "@/lib/utils";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!canEdit(session?.user.role)) redirect("/dashboard");

  const [person, allPersons] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: { relationships: true },
    }),
    prisma.person.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
  ]);

  if (!person) notFound();

  const parentIds = person.relationships
    .filter((r) => r.type === "PARENT")
    .map((r) => r.relatedPersonId);

  const partnerIds = person.relationships
    .filter((r) => r.type === "PARTNER")
    .map((r) => r.relatedPersonId);

  const childRels = person.relationships.filter((r) => r.type === "CHILD");
  const childIds = childRels.map((r) => ({
    personId: r.relatedPersonId,
    partnerId: r.partnerId ?? undefined,
  }));

  const persons = allPersons.map((p) => ({
    ...p,
    birthDate: p.birthDate?.toISOString() ?? null,
    deathDate: p.deathDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const initialData = {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    birthDate: person.birthDate?.toISOString() ?? null,
    deathDate: person.deathDate?.toISOString() ?? null,
    parentIds,
    partnerIds,
    childIds,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Modifier : {person.firstName} {person.lastName}
      </h1>
      <PersonForm persons={persons} initialData={initialData} />
    </div>
  );
}
