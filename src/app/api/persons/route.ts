import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const persons = await prisma.person.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json(
    persons.map((p) => ({
      ...p,
      birthDate: p.birthDate?.toISOString() ?? null,
      deathDate: p.deathDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("EDITOR");
  if (error) return error;

  const body = await req.json();
  const { firstName, lastName, birthDate, deathDate, parentIds, partnerIds, childIds } = body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }

  const person = await prisma.$transaction(async (tx) => {
    const created = await tx.person.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
      },
    });

    const rels: { personId: string; relatedPersonId: string; type: "PARENT" | "CHILD" | "PARTNER"; partnerId?: string }[] = [];

    for (const pid of parentIds ?? []) {
      rels.push({ personId: created.id, relatedPersonId: pid, type: "PARENT" });
      rels.push({ personId: pid, relatedPersonId: created.id, type: "CHILD" });
    }

    for (const pid of partnerIds ?? []) {
      rels.push({ personId: created.id, relatedPersonId: pid, type: "PARTNER" });
      rels.push({ personId: pid, relatedPersonId: created.id, type: "PARTNER" });
    }

    for (const child of childIds ?? []) {
      rels.push({ personId: child.personId, relatedPersonId: created.id, type: "PARENT", partnerId: child.partnerId });
      rels.push({ personId: created.id, relatedPersonId: child.personId, type: "CHILD", partnerId: child.partnerId });
    }

    for (const rel of rels) {
      await tx.relationship.upsert({
        where: {
          personId_relatedPersonId_type: {
            personId: rel.personId,
            relatedPersonId: rel.relatedPersonId,
            type: rel.type,
          },
        },
        create: rel,
        update: { partnerId: rel.partnerId },
      });
    }

    return created;
  });

  return NextResponse.json({
    ...person,
    birthDate: person.birthDate?.toISOString() ?? null,
    deathDate: person.deathDate?.toISOString() ?? null,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  });
}
