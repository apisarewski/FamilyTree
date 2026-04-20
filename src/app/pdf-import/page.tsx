"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ExtractedPerson {
  tempId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
}

interface ExtractedRelationship {
  personTempId: string;
  relatedPersonTempId: string;
  type: "PARENT" | "CHILD" | "PARTNER";
  note?: string;
}

interface ExtractionResult {
  persons: ExtractedPerson[];
  relationships: ExtractedRelationship[];
  warnings: string[];
}

type Step = "upload" | "preview" | "done";

export default function PdfImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [editedPersons, setEditedPersons] = useState<ExtractedPerson[]>([]);
  const [importCount, setImportCount] = useState(0);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pdf-import", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de l'extraction");
      }
      const data: ExtractionResult = await res.json();
      setResult(data);
      setEditedPersons(data.persons);
      setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!result) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pdf-import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persons: editedPersons,
          relationships: result.relationships,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de l'import");
      }

      const data = await res.json();
      setImportCount(data.imported);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function updatePerson(idx: number, field: keyof ExtractedPerson, value: string | null) {
    setEditedPersons((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  function removePerson(tempId: string) {
    setEditedPersons((prev) => prev.filter((p) => p.tempId !== tempId));
  }

  if (step === "done") {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Import réussi !</h1>
        <p className="text-gray-600">{importCount} personne(s) importée(s) dans l&apos;arbre.</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push("/dashboard")}>Voir l&apos;arbre</Button>
          <Button variant="secondary" onClick={() => { setStep("upload"); setFile(null); setResult(null); }}>
            Importer un autre PDF
          </Button>
        </div>
      </div>
    );
  }

  if (step === "preview" && result) {
    const typeLabel = { PARENT: "parent de", CHILD: "enfant de", PARTNER: "partenaire de" };
    const getName = (tempId: string) => {
      const p = editedPersons.find((x) => x.tempId === tempId);
      return p ? `${p.firstName} ${p.lastName}` : tempId;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Prévisualisation de l&apos;extraction</h1>
          <button onClick={() => setStep("upload")} className="text-sm text-gray-500 hover:text-gray-900">
            ← Recommencer
          </button>
        </div>

        {result.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-medium text-amber-800 mb-2">Avertissements</h3>
            <ul className="list-disc list-inside space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-sm text-amber-700">{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">
              {editedPersons.length} personne(s) extraite(s)
            </h2>
            <p className="text-xs text-gray-400">Vous pouvez corriger les données avant d&apos;importer.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {editedPersons.map((p, idx) => (
              <div key={p.tempId} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <Input
                  label="Prénom"
                  value={p.firstName}
                  onChange={(e) => updatePerson(idx, "firstName", e.target.value)}
                  className="col-span-1"
                />
                <Input
                  label="Nom"
                  value={p.lastName}
                  onChange={(e) => updatePerson(idx, "lastName", e.target.value)}
                  className="col-span-1"
                />
                <Input
                  label="Naissance"
                  type="date"
                  value={p.birthDate?.split("T")[0] ?? ""}
                  onChange={(e) => updatePerson(idx, "birthDate", e.target.value || null)}
                  className="col-span-1"
                />
                <Input
                  label="Décès"
                  type="date"
                  value={p.deathDate?.split("T")[0] ?? ""}
                  onChange={(e) => updatePerson(idx, "deathDate", e.target.value || null)}
                  className="col-span-1"
                />
                <button
                  onClick={() => removePerson(p.tempId)}
                  className="text-red-400 hover:text-red-600 text-sm pb-2 text-left"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        {result.relationships.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">
              {result.relationships.length} relation(s) détectée(s)
            </h2>
            <ul className="space-y-1">
              {result.relationships.map((r, i) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="font-medium">{getName(r.personTempId)}</span>{" "}
                  est {typeLabel[r.type]}{" "}
                  <span className="font-medium">{getName(r.relatedPersonTempId)}</span>
                  {r.note && <span className="text-gray-400 ml-1">({r.note})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleConfirm} disabled={loading || editedPersons.length === 0}>
            {loading ? "Import en cours..." : `Importer ${editedPersons.length} personne(s)`}
          </Button>
          <Button variant="secondary" onClick={() => setStep("upload")}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import PDF</h1>
        <p className="text-gray-500 mt-1">
          Uploadez un PDF d&apos;arbre généalogique, d&apos;acte de naissance ou de livret de famille.
          Claude va en extraire automatiquement les personnes et leurs relations.
        </p>
      </div>

      <form onSubmit={handleExtract} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Fichier PDF
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required
          />
          {file && (
            <p className="text-xs text-gray-400 mt-1">
              {file.name} — {(file.size / 1024).toFixed(0)} Ko
            </p>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <strong>Comment ça marche :</strong> Claude analyse le PDF et extrait toutes les personnes
          avec leurs dates et relations. Vous pourrez corriger les erreurs avant d&apos;importer en base.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button type="submit" disabled={!file || loading} size="lg">
          {loading ? "Extraction en cours (peut prendre 30s)..." : "Analyser le PDF avec Claude"}
        </Button>
      </form>
    </div>
  );
}
