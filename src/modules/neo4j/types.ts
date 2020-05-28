import { DateTime, Integer, Node, Relationship } from 'neo4j-driver';

// From neo4j-driver
export { Integer };

// From Custom interface
const stringLitArray = <L extends string>(arr: L[]) => arr;

const sections = stringLitArray([
  'TAGGED',
  'SEC_ALL',
  'SEC_SIGHTS',
  'SEC_FOOD',
]);
export type Sections = typeof sections[number];
export const isSections = (x: any): x is Sections => sections.includes(x);

export interface PostNode extends Node {
  properties: Post;
}
export interface Post {
  rated: Rated | RatedRelationship | null;
  hearted: Hearted | HeartedRelationship | null;
  date: DateTime | string;
  id: string;
  img_url: string;
  content: string;
  likes: Number | Integer;
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
