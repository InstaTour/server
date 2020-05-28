export const enum Query {
  create_user = 'CREATE (:User {id: $id, nickname: $nickname, email: $email, profile: $profile, created_at: DATETIME()})',
  create_post_instagram = 'CREATE (:Post:Instagram {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
  create_post_instatour = `MATCH (user:User {id: $uid})
                          MATCH (tag:HashTag {id: $hid})
                          CREATE (user)-[:POSTED]->(post:Post:InstaTour {id: apoc.create.uuid(), img_url: $img_url, content: $content, likes: 0, date: DATETIME()})
                          WITH post, tag
                          CALL apoc.create.relationship(post, $section, {}, tag)
                          YIELD rel
                          RETURN post`,
  update_user = `MATCH (p:User {id: $id})
                CALL apoc.create.setProperties(p, $keys, $values) YIELD node 
                RETURN node`,
  update_post = `MATCH (p:Post {id: $id}) 
                CALL apoc.create.setProperties(p, $keys, $values) YIELD node 
                RETURN node`,
  post_hashtag_relation = `MATCH (p:Post {id: $pid}) 
                          MERGE (t:HashTag {id: $tid}) 
                          MERGE (p)-[:TAGGED]->(t)`,
  search_with_hashtag = `MATCH (post:Post)-[:TAGGED]->(hashtag:HashTag {id: $hid})
                        OPTIONAL MATCH (user:User {id: $uid})-[hearted:HEARTED]->(post)
                        OPTIONAL MATCH (user)-[rated:RATED]->(post)
                        WITH post, hearted, rated
                        ORDER BY hearted, post.likes DESC
                        WITH COLLECT(post {.*, hearted: hearted, rated: rated}) AS postlist
                        RETURN postlist[$skip..$skip+$limit] AS posts, SIZE(postlist) AS num`,
  get_user = `MATCH (user:User {id: $uid})
              RETURN user`,
  get_post = `MATCH (n:User {id: $uid})
              MATCH (post:Post {id: $pid})
              CREATE (n)-[:CLICKED {created_at: DATETIME()}]->(post)
              RETURN post`,
  get_user_heart = `MATCH (user:User {id: $uid})-[r:HEARTED]->(post)
                    WITH user, post, r
                    ORDER BY r.created_at DESC
                    RETURN user, COLLECT(post) as posts`,
  delete_user = `MATCH (user:User {id: $id})
                DETACH DELETE user
                RETURN user`,
  heart_post = `MATCH (n:User {id: $uid})
                MATCH (p:Post {id: $pid})
                CREATE (n)-[r:HEARTED {created_at: DATETIME()}]->(p)
                RETURN n, r, p`,
  delete_heart = `MATCH (n:User {id: $uid})-[r:HEARTED]->(p:Post {id: $pid})
                  DELETE r
                  RETURN n, r, p`,
  rates_post = `MATCH (n:User {id: $uid})
                MATCH (p:Post {id: $pid})
                MERGE (n)-[r:RATED]->(p)
                SET r.updated_at = DATETIME(), r.rates = $rates
                RETURN n, r, p`,
  delete_rate = `MATCH (n:User {id: $uid})-[r:RATED]->(p:Post {id: $pid})
                DELETE r
                RETURN n, r, p`,
}
