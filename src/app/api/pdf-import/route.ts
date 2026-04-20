import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `Tu es un expert en généalogie. Analyse ce document (arbre généalogique, acte de naissance, livret de famille, etc.) et extrait toutes les personnes et leurs relations familiales.

Retourne un JSON valide avec la structure suivante :
{
  "persons": [
    {
      "tempId": "string unique comme p1, p2, etc.",
      "firstName": "string",
      "lastName": "string",
      "birthDate": "YYYY-MM-DD ou null si inconnue",
      "deathDate": "YYYY-MM-DD ou null si inconnue ou toujours en vie"
    }
  ],
  "relationships": [
    {
      "personTempId": "tempId de la personne",
      "relatedPersonTempId": "tempId de la personne liée",
      "type": "PARENT | CHILD | PARTNER",
      "note": "information contextuelle optionnelle"
    }
  ],
  "warnings": ["liste des ambiguïtés ou personnes non clairement identifiées"]
}

Règles :
- PARENT signifie que relatedPersonTempId est un parent de personTempId
- CHILD signifie que relatedPersonTempId est un enfant de personTempId
- PARTNER signifie une relation conjugale/partenariat
- Crée des relations bidirectionnelles si possible pour clarté
- Si une date est approximative, indique l'année seulement (YYYY-01-01)
- Ne génère que le JSON, sans texte explicatif avant ou après`;

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json({ error: "Réponse Claude invalide" }, { status: 500 });
  }

  let extracted: unknown;
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    extracted = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json(
      { error: "Impossible de parser la réponse", raw: textContent.text },
      { status: 422 }
    );
  }

  return NextResponse.json(extracted);
}
