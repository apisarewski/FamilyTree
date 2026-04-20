export type Role = "ADMIN" | "EDITOR" | "READER";
export type RelationshipType = "PARENT" | "CHILD" | "PARTNER";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  personId: string;
  relatedPersonId: string;
  type: RelationshipType;
  partnerId: string | null;
  createdAt: string;
}

export interface PersonWithRelations extends Person {
  relationships: (Relationship & { relatedPerson: Person })[];
  relatedTo: (Relationship & { person: Person })[];
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PersonFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  parentIds: string[];
  partnerIds: string[];
  childIds: { personId: string; partnerId?: string }[];
}

export interface ExtractedPerson {
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  relations: {
    type: RelationshipType;
    name: string;
    partnerId?: string;
  }[];
}
