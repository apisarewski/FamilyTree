import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, canEdit } from "@/lib/utils";
import Link from "next/link";
import { DeletePersonButton } from "@/components/forms/DeletePersonButton";

async function getPerson(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      relationships: { include: { relatedPerson: true } },
      relatedTo: { include: { person: true } },
    },
  });
  return person;
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const person = await getPerson(id);

  if (!person) notFound();

  const editor = canEdit(session?.user.role);

  const parents = person.relationships
    .filter((r) => r.type === "PARENT")
    .map((r) => r.relatedPerson);

  const partners = person.relationships
    .filter((r) => r.type === "PARTNER")
    .map((r) => r.relatedPerson);

  const childrenRels = person.relatedTo.filter((r) => r.type === "PARENT");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {person.firstName} {person.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              <span className="font-medium">Naissance :</span>{" "}
              {formatDate(person.birthDate?.toISOString())}
            </span>
            {person.deathDate && (
              <span>
                <span className="font-medium">Décès :</span>{" "}
                {formatDate(person.deathDate.toISOString())}
              </span>
            )}
          </div>
        </div>
        {editor && (
          <div className="flex items-center gap-2">
            <Link
              href={`/persons/${person.id}/edit`}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Modifier
            </Link>
            <DeletePersonButton personId={person.id} personName={`${person.firstName} ${person.lastName}`} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <Section title="Parents">
          {parents.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1">
              {parents.map((p) => (
                <li key={p.id}>
                  <Link href={`/persons/${p.id}`} className="text-indigo-600 hover:underline text-sm">
                    {p.firstName} {p.lastName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Partenaire(s)">
          {partners.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1">
              {partners.map((p) => (
                <li key={p.id}>
                  <Link href={`/persons/${p.id}`} className="text-indigo-600 hover:underline text-sm">
                    {p.firstName} {p.lastName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Enfant(s)">
          {childrenRels.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2">
              {childrenRels.map((rel) => {
                const child = rel.person;
                return (
                  <li key={child.id} className="flex items-center gap-2">
                    <Link href={`/persons/${child.id}`} className="text-indigo-600 hover:underline text-sm">
                      {child.firstName} {child.lastName}
                    </Link>
                    {rel.partnerId && (
                      <PartnerBadge partnerId={rel.partnerId} partners={partners} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <div className="flex gap-2">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
          ← Retour à l&apos;arbre
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-gray-400 italic">Aucun(e)</p>;
}

function PartnerBadge({
  partnerId,
  partners,
}: {
  partnerId: string;
  partners: { id: string; firstName: string; lastName: string }[];
}) {
  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return null;
  return (
    <span className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">
      avec {partner.firstName} {partner.lastName}
    </span>
  );
}
