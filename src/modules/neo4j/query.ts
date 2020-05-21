export const enum Query {
  create_user = 'CREATE (:User {id: $id, nickname: $nickname, email: $email, profile: $profile})',
  create_post_instagram = 'CREATE (:Post:Instagram {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
  create_post_instatour = 'CREATE (:Post:Instatour {id: $key, img_url: $img_url, content: $content, likes: $likes, date: $date})',
  update_user = `MATCH (p:User {id: $id}) 
                CALL apoc.create.setProperties(p, $keys, $values) YIELD node 
                RETURN node`,
  update_post = `MATCH (p:Post {id: $id}) 
                CALL apoc.create.setProperties(p, $keys, $values) YIELD node 
                RETURN node`,
  post_hashtag_relation = `MERGE (p:Post {id: $pid}) 
                          MERGE (t:HashTag {id: $tid}) 
                          MERGE (p)-[:TAGGED]->(t)`,
  get_posts_with_hashtag = `MATCH (post:Post)-[:TAGGED]->(hashtag:HashTag {id: $id})
                            WITH hashtag, post
                            ORDER BY post.likes DESC
                            WITH hashtag, COLLECT(post) as postlist
                            RETURN hashtag, postlist[$skip..$skip+$limit] as posts, SIZE(postlist) as num`,
}
