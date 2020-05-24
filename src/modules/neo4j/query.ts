export const enum Query {
  create_user = 'CREATE (:User {id: $id, nickname: $nickname, email: $email, profile: $profile, created_at: DATETIME()})',
  create_post_instagram = 'CREATE (:Post:Instagram {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
  create_post_instatour = 'CREATE (:Post:Instatour {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
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
                        WITH COLLECT(post {.*, hearted: hearted, rated: rated}) as postlist
                        RETURN postlist[$skip..$skip+$limit] as posts, SIZE(postlist) as num`,
  heart_post = `MATCH (n:User {id: $uid})
                MATCH (p:Post {id: $pid})
                CREATE (n)-[r:HEARTED {created_at: DATETIME()}]->(p)
                RETURN n, r, p`,
  delete_heart = `MATCH (n:User {id: $uid})-[r:HEARTED]->(p:Post {id: $pid})
                  DELETE r
                  RETURN n, r, p`,
  rate_post = `MATCH (n:User {id: $uid})
              MATCH (p:Post {id: $pid})
              MERGE (n)-[r:RATED]->(p)
              SET r.updated_at = DATETIME(), r.rates = $rates
              RETURN n, r, p`,
  delete_rate = `MATCH (n:User {id: $uid})-[r:RATED]->(p:Post {id: $pid})
                DELETE r
                RETURN n, r, p`,
  click_post = `MATCH (n:User {id: $uid})
                MATCH (p:Post {id: $pid})
                CREATE (n)-[r:CLICKED {created_at: DATETIME()}]->(p)
                RETURN n, r, p`,
}
