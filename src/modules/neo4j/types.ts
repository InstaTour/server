import { DateTime, Integer, Node, Relationship, Time } from 'neo4j-driver';

// From neo4j-driver
export { Integer };

// From Custom interface
const stringLitArray = <L extends string>(arr: L[]) => arr;

const sections = stringLitArray(['ALL', 'SIGHTS', 'FOOD']);
export type Sections = typeof sections[number];
export const isSections = (x: any): x is Sections => sections.includes(x);

export interface Post {
  rated: Rated | RatedRelationship | null;
  hearted: Hearted | HeartedRelationship | null;
  date: DateTime;
  id: string;
  img_url: string;
  content: string;
  likes: Number;
}

export interface HeartedRelationship extends Relationship {
  properties: Hearted;
}

export interface Hearted {
  created_at: DateTime | string;
}

export interface RatedRelationship extends Relationship {
  properties: Rated;
}

export interface Rated {
  updated_at: DateTime | string;
  rating: Number;
}
