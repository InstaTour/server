// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

import neo4j, { QueryResult } from 'neo4j-driver';
import { Parameters } from 'neo4j-driver/types/query-runner';

const driver = neo4j.driver(
  process.env.NEO4J_URL as string,
  neo4j.auth.basic(
    process.env.NEO4J_ID as string,
    process.env.NEO4J_PW as string
  )
);

export const enum Query {
  create_user = 'CREATE (:User {id: $id, nickname: $nickname, email: $email, profile: $profile})',
  create_post_instagram = 'CREATE (:Post:Instagram {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
  create_post_instatour = 'CREATE (:Post:Instatour {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
  update_user = 'MATCH (p:User {id: $id}) CALL apoc.create.setProperties(p, $keys, $values) YIELD node RETURN node',
  update_post = 'MATCH (p:Post {id: $id}) CALL apoc.create.setProperties(p, $keys, $values) YIELD node RETURN node',
  post_hashtag_relation = 'MERGE (p:Post {id: $pid}) MERGE (t:HashTag {id: $tid}) MERGE (p)-[:TAGGED]->(t)',
}

export async function tx(querys: Query[], params: Parameters[]) {
  const session = driver.session();
  const txc = session.beginTransaction();
  try {
    let result: QueryResult[] = [];
    for (const i in querys) {
      result.push(await txc.run(querys[i], params[i]));
    }
    await txc.commit();
    console.log('committed');
    return result;
  } catch (error) {
    console.error(error);
    await txc.rollback();
    console.log('rolled back');
    return null;
  } finally {
    await session.close();
  }
}
