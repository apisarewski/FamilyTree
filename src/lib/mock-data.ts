import type { Person, Relationship } from "@/types";

export const MOCK_PERSONS: Person[] = [
  { id: "p1", firstName: "Jean", lastName: "Dupont", birthDate: "1940-03-15", deathDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "p2", firstName: "Marie", lastName: "Dupont", birthDate: "1943-07-22", deathDate: "2010-11-30", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "p3", firstName: "Pierre", lastName: "Dupont", birthDate: "1965-01-10", deathDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "p4", firstName: "Claire", lastName: "Martin", birthDate: "1968-09-05", deathDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "p5", firstName: "Lucas", lastName: "Dupont", birthDate: "1990-06-20", deathDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "p6", firstName: "Sophie", lastName: "Dupont", birthDate: "1993-12-03", deathDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const MOCK_RELATIONSHIPS: Relationship[] = [
  { id: "r1", personId: "p3", relatedPersonId: "p1", type: "PARENT", partnerId: null, createdAt: new Date().toISOString() },
  { id: "r2", personId: "p3", relatedPersonId: "p2", type: "PARENT", partnerId: null, createdAt: new Date().toISOString() },
  { id: "r3", personId: "p1", relatedPersonId: "p2", type: "PARTNER", partnerId: null, createdAt: new Date().toISOString() },
  { id: "r4", personId: "p3", relatedPersonId: "p4", type: "PARTNER", partnerId: null, createdAt: new Date().toISOString() },
  { id: "r5", personId: "p5", relatedPersonId: "p3", type: "PARENT", partnerId: "p4", createdAt: new Date().toISOString() },
  { id: "r6", personId: "p6", relatedPersonId: "p3", type: "PARENT", partnerId: "p4", createdAt: new Date().toISOString() },
];
