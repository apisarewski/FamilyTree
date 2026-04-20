"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface DeletePersonButtonProps {
  personId: string;
  personName: string;
}

export function DeletePersonButton({ personId, personName }: DeletePersonButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/persons/${personId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Supprimer {personName} ?</span>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
          {loading ? "..." : "Confirmer"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
      Supprimer
    </Button>
  );
}
