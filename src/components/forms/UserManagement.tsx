"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { User, Role } from "@/types";

interface UserManagementProps {
  initialUsers: User[];
}

const roleBadge: Record<Role, "admin" | "editor" | "reader"> = {
  ADMIN: "admin",
  EDITOR: "editor",
  READER: "reader",
};

const roleLabel: Record<Role, string> = {
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  READER: "Lecteur",
};

export function UserManagement({ initialUsers }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("READER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur serveur");
      }

      const newUser: User = await res.json();
      setUsers((prev) => [...prev, newUser]);
      setShowForm(false);
      setEmail("");
      setPassword("");
      setRole("READER");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      const updated: User = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    }
  }

  async function handleDelete(userId: string) {
    if (deletingId !== userId) {
      setDeletingId(userId);
      return;
    }

    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          + Inviter un utilisateur
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Nouvel utilisateur</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="email"
                label="Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@exemple.com"
              />
              <Input
                id="password"
                label="Mot de passe *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="READER">Lecteur</option>
                <option value="EDITOR">Éditeur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer l'utilisateur"}
              </Button>
              <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setError(""); }}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Rôle</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{user.email}</td>
                <td className="px-6 py-4">
                  <Badge variant={roleBadge[user.role]}>{roleLabel[user.role]}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="READER">Lecteur</option>
                      <option value="EDITOR">Éditeur</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {deletingId === user.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Confirmer ?</span>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucun utilisateur.</div>
        )}
      </div>
    </div>
  );
}
