// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URL as string,
  neo4j.auth.basic(
    process.env.NEO4J_ID as string,
    process.env.NEO4J_PW as string
  )
);

const session = driver.session();

export default session;
