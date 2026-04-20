import { prisma } from "@/lib/prisma";
import { UserManagement } from "@/components/forms/UserManagement";

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
      <UserManagement initialUsers={users} />
    </div>
  );
}
