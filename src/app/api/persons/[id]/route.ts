import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      relationships: { include: { relatedPerson: true } },
      relatedTo: { include: { person: true } },
    },
  });

  if (!person) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(person);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("EDITOR");
  if (error) return error;
  const { id } = await params;

  const body = await req.json();
  const { firstName, lastName, birthDate, deathDate, parentIds, partnerIds, childIds } = body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }

  const person = await prisma.$transaction(async (tx) => {
    const updated = await tx.person.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
      },
    });

    await tx.relationship.deleteMany({ where: { OR: [{ personId: id }, { relatedPersonId: id }] } });

    const rels: { personId: string; relatedPersonId: string; type: "PARENT" | "CHILD" | "PARTNER"; partnerId?: string }[] = [];

    for (const pid of parentIds ?? []) {
      rels.push({ personId: id, relatedPersonId: pid, type: "PARENT" });
      rels.push({ personId: pid, relatedPersonId: id, type: "CHILD" });
    }

    for (const pid of partnerIds ?? []) {
      rels.push({ personId: id, relatedPersonId: pid, type: "PARTNER" });
      rels.push({ personId: pid, relatedPersonId: id, type: "PARTNER" });
    }

    for (const child of childIds ?? []) {
      rels.push({ personId: child.personId, relatedPersonId: id, type: "PARENT", partnerId: child.partnerId });
      rels.push({ personId: id, relatedPersonId: child.personId, type: "CHILD", partnerId: child.partnerId });
    }

    if (rels.length > 0) {
      await tx.relationship.createMany({ data: rels, skipDuplicates: true });
    }

    return updated;
  });

  return NextResponse.json({
    ...person,
    birthDate: person.birthDate?.toISOString() ?? null,
    deathDate: person.deathDate?.toISOString() ?? null,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth("EDITOR");
  if (error) return error;
  const { id } = await params;

  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
