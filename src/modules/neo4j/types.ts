import { DateTime, Integer } from 'neo4j-driver';

// From neo4j-driver
export { Integer };

// From Custom interface
export type Sections = 'ALL' | 'SIGHTS' | 'FOOD';

export interface PostNode extends Node {
  properties: Post;
}

export interface Post {
  date: DateTime;
  id: string;
  img_url: string;
  content: string;
  likes: Number;
}
