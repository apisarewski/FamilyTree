import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { email, password, role } = body;

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const validRoles = ["ADMIN", "EDITOR", "READER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.trim(), passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}
