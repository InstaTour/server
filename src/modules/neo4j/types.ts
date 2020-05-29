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

export interface UserNode extends Node {
  properties: User;
}

export interface User {
  created_at: DateTime | string;
  updated_at: DateTime | string;
  id: string;
  nickname: string;
  profile: string;
  email: string;
}

export interface PostNode extends Node {
  properties: Post;
}
export interface Post {
  date: DateTime | string;
  id: string;
  img_url: string;
  content: string;
  likes: Number | Integer;
  rated?: Rated | RatedRelationship | Number | null;
  hearted?: Hearted | HeartedRelationship | boolean | null;
  views?: Number | Integer;
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
  rates: Number;
}
