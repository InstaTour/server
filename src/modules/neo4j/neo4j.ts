// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

import neo4j, { QueryResult, Integer, int } from 'neo4j-driver';
import { Parameters } from 'neo4j-driver/types/query-runner';
import { Query } from './query';

const driver = neo4j.driver(
  process.env.NEO4J_URL as string,
  neo4j.auth.basic(
    process.env.NEO4J_ID as string,
    process.env.NEO4J_PW as string
  )
);

// From Neo4j-driver
export { int };

// Custom Function
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

export function toNumber(num: any) {
  if (typeof num == 'number') return num;
  else if (neo4j.integer.inSafeRange(num)) return num.toNumber();
  else return null;
}

export function toDateString(str: any) {
  if (typeof str == 'string') return str;
  else {
    return new Date(
      toNumber(str.year),
      toNumber(str.month) - 1,
      toNumber(str.day),
      toNumber(str.hour),
      toNumber(str.minute),
      toNumber(str.second)
    ).toISOString();
  }
}
