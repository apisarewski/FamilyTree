import type { Role } from "@/types";

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function canEdit(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function canAdmin(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
