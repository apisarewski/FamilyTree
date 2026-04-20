import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/types";

export async function requireAuth(minRole?: Role) {
  const session = await auth();
  if (!session) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }

  if (minRole) {
    const hierarchy: Record<Role, number> = { READER: 0, EDITOR: 1, ADMIN: 2 };
    if (hierarchy[session.user.role] < hierarchy[minRole]) {
      return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
    }
  }

  return { session };
}
