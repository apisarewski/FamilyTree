"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Person } from "@/types";

interface PersonFormProps {
  persons: Person[];
  initialData?: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    deathDate: string | null;
    parentIds: string[];
    partnerIds: string[];
    childIds: { personId: string; partnerId?: string }[];
  };
}

export function PersonForm({ persons, initialData }: PersonFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [firstName, setFirstName] = useState(initialData?.firstName ?? "");
  const [lastName, setLastName] = useState(initialData?.lastName ?? "");
  const [birthDate, setBirthDate] = useState(
    initialData?.birthDate ? initialData.birthDate.split("T")[0] : ""
  );
  const [deathDate, setDeathDate] = useState(
    initialData?.deathDate ? initialData.deathDate.split("T")[0] : ""
  );
  const [parentIds, setParentIds] = useState<string[]>(initialData?.parentIds ?? []);
  const [partnerIds, setPartnerIds] = useState<string[]>(initialData?.partnerIds ?? []);
  const [childIds, setChildIds] = useState<{ personId: string; partnerId?: string }[]>(
    initialData?.childIds ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const availablePersons = persons.filter((p) => p.id !== initialData?.id);

  function validate() {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Le prénom est requis.";
    if (!lastName.trim()) errs.lastName = "Le nom est requis.";
    if (birthDate && deathDate && new Date(birthDate) > new Date(deathDate)) {
      errs.deathDate = "La date de décès doit être après la naissance.";
    }
    return errs;
  }

  function toggleParent(id: string) {
    setParentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 2)
    );
  }

  function togglePartner(id: string) {
    setPartnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleChild(id: string) {
    setChildIds((prev) =>
      prev.some((c) => c.personId === id)
        ? prev.filter((c) => c.personId !== id)
        : [...prev, { personId: id }]
    );
  }

  function setChildPartner(childId: string, partnerId: string) {
    setChildIds((prev) =>
      prev.map((c) => (c.personId === childId ? { ...c, partnerId: partnerId || undefined } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    setServerError("");

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      parentIds,
      partnerIds,
      childIds,
    };

    try {
      const url = isEdit ? `/api/persons/${initialData.id}` : "/api/persons";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur serveur");
      }

      const created = await res.json();
      router.push(`/persons/${created.id}`);
      router.refresh();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="Prénom *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            placeholder="Jean"
          />
          <Input
            id="lastName"
            label="Nom *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            placeholder="Dupont"
          />
          <Input
            id="birthDate"
            label="Date de naissance"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <Input
            id="deathDate"
            label="Date de décès"
            type="date"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            error={errors.deathDate}
          />
        </div>
      </div>

      {availablePersons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Relations</h2>

          <RelationSection
            title="Parents (max 2)"
            persons={availablePersons}
            selectedIds={parentIds}
            onToggle={toggleParent}
          />

          <RelationSection
            title="Partenaire(s)"
            persons={availablePersons}
            selectedIds={partnerIds}
            onToggle={togglePartner}
          />

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Enfant(s)</p>
            <div className="space-y-2">
              {availablePersons.map((p) => {
                const child = childIds.find((c) => c.personId === p.id);
                const isSelected = !!child;
                return (
                  <div key={p.id} className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleChild(p.id)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm">
                        {p.firstName} {p.lastName}
                      </span>
                    </label>
                    {isSelected && partnerIds.length > 0 && (
                      <select
                        value={child?.partnerId ?? ""}
                        onChange={(e) => setChildPartner(p.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">— Avec quel partenaire ?</option>
                        {partnerIds.map((pid) => {
                          const partner = persons.find((x) => x.id === pid);
                          return partner ? (
                            <option key={pid} value={pid}>
                              {partner.firstName} {partner.lastName}
                            </option>
                          ) : null;
                        })}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer la personne"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

function RelationSection({
  title,
  persons,
  selectedIds,
  onToggle,
}: {
  title: string;
  persons: Person[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => {
          const selected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selected
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {p.firstName} {p.lastName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
