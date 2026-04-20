"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavbarProps {
  userEmail: string;
  userRole: Role;
}

export function Navbar({ userEmail, userRole }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Arbre généalogique", roles: ["ADMIN", "EDITOR", "READER"] },
    { href: "/persons/new", label: "Ajouter une personne", roles: ["ADMIN", "EDITOR"] },
    { href: "/pdf-import", label: "Import PDF", roles: ["ADMIN"] },
    { href: "/users", label: "Utilisateurs", roles: ["ADMIN"] },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-indigo-600 font-bold text-lg">
            FamilyTree
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems
              .filter((item) => item.roles.includes(userRole))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
            {userRole}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
