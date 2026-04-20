import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

interface PersonInput {
  tempId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
}

interface RelationshipInput {
  personTempId: string;
  relatedPersonTempId: string;
  type: "PARENT" | "CHILD" | "PARTNER";
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { persons, relationships } = body as {
    persons: PersonInput[];
    relationships: RelationshipInput[];
  };

  if (!persons?.length) {
    return NextResponse.json({ error: "Aucune personne à importer" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const tempIdToDbId = new Map<string, string>();

    for (const p of persons) {
      if (!p.firstName?.trim() || !p.lastName?.trim()) continue;
      const created = await tx.person.create({
        data: {
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          birthDate: p.birthDate ? new Date(p.birthDate) : null,
          deathDate: p.deathDate ? new Date(p.deathDate) : null,
        },
      });
      tempIdToDbId.set(p.tempId, created.id);
    }

    for (const rel of relationships ?? []) {
      const personId = tempIdToDbId.get(rel.personTempId);
      const relatedPersonId = tempIdToDbId.get(rel.relatedPersonTempId);
      if (!personId || !relatedPersonId) continue;

      await tx.relationship.upsert({
        where: {
          personId_relatedPersonId_type: { personId, relatedPersonId, type: rel.type },
        },
        create: { personId, relatedPersonId, type: rel.type },
        update: {},
      });
    }

    return { imported: tempIdToDbId.size };
  });

  return NextResponse.json(result);
}
