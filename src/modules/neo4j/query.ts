export const enum Query {
  create_user = 'CREATE (:User {id: $id, nickname: $nickname, email: $email, profile: $profile, posting: 0, created_at: DATETIME(), updated_at: DATETIME()})',
  create_post_instagram = 'CREATE (:Post:Instagram {id: $key, img_url: $img_url, content: $content, likes: $likes, views: 0, date: $date })',
  create_post_instatour = `MATCH (user:User {id: $uid})
                          MATCH (tag:HashTag {id: $hid})
                          CREATE (user)-[:POSTED]->(post:Post:InstaTour {id: apoc.create.uuid(), img_url: $img_url, content: $content, likes: 0, views: 0, date: DATETIME()})
                          CREATE (post)-[:TAGGED {section: $section}]->(tag)
                          WITH user, post, tag
                          CALL apoc.atomic.add(user, 'posting', 1) YIELD oldValue, newValue
                          RETURN post`,
  update_user = `MATCH (p:User {id: $uid})
                CALL apoc.create.setProperties(p, $keys, $values) YIELD node 
                RETURN node`,
  update_post = `MATCH (p:Post {id: $pid}) 
                CALL apoc.create.setProperties(p, $keys, $values) YIELD node 
                RETURN node`,
  post_hashtag_relation = `MATCH (p:Post {id: $pid}) 
                          MERGE (t:HashTag {id: $tid}) 
                          MERGE (p)-[:TAGGED]->(t)`,
  search_with_hashtag = `MATCH (user:User {id: $uid})
                        MATCH (tag1:HashTag {id: $hid})
                        OPTIONAL MATCH (tag1)-[:TRANSLATED]-(tag2:HashTag)
                        WITH user, COLLECT(tag1) + COLLECT(tag2) AS hashtaglist
                        CREATE (user)-[:CLICKED {created_at: DATETIME()}]->(tag1)
                        WITH user, hashtaglist
                        UNWIND(hashtaglist) AS hashtags
                        WITH DISTINCT hashtags, user
                        MATCH (hashtags)-[rel:TAGGED]-(post:Post)
                        WITH hashtags, post, (CASE
                        WHEN 'SEC_ALL' = $section THEN true
                        WHEN rel.section = $section THEN true
                        ELSE false
                        END) AS inSection, user
                        WHERE inSection = true
                        OPTIONAL MATCH (user)-[hearted:HEARTED]->(post)
                        OPTIONAL MATCH (user)-[rated:RATED]->(post)
                        WITH hashtags, post, hearted, rated
                        ORDER BY hearted, post.views DESC, post.likes DESC
                        WITH COLLECT(DISTINCT hashtags) AS hashtaglist, COLLECT(DISTINCT post {.*, hearted: hearted, rated: rated}) as postlist
                        WITH postlist[$skip..$skip+$limit] as posts, SIZE(postlist) as num, hashtaglist
                        UNWIND(hashtaglist) as hashtags
                        SET hashtags.apx_num = num
                        WITH hashtags, posts, num
                        WHERE hashtags.id = $hid
                        RETURN hashtags as hashtag, posts, num`,
  get_user = `MATCH (user:User {id: $uid})
              RETURN user`,
  get_post = `MATCH (post:Post {id: $pid})
              OPTIONAL MATCH (post)<-[r:RATED]-()
              OPTIONAL MATCH (post)<-[:POSTED]-(writer)
              CALL apoc.atomic.add(post, 'views', 1) YIELD oldValue, newValue
              WITH post, writer, AVG(r.rates) as avg_rates, COUNT(r) as reviews
              RETURN post, writer, reviews, (CASE 
              WHEN avg_rates IS NULL THEN 0
              ELSE avg_rates
              END) as avg_rates`,
  get_user_heart = `MATCH (user:User {id: $uid})-[r:HEARTED]->(post)
                    WITH user, post, r
                    ORDER BY r.created_at DESC
                    RETURN user, COLLECT(post) as posts`,
  get_user_posting = `MATCH (user:User {id: $uid})-[r:POSTED]->(post)
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
  stats_top_click = `MATCH (tag:HashTag)<-[r:CLICKED]-()
                    WHERE date(datetime({epochmillis:apoc.date.add(timestamp(), 'ms', -30, 'd')})) <= date(datetime(r.created_at)) <=date()
                    WITH tag, COUNT(r) AS views
                    ORDER BY views DESC
                    MATCH (tag)<-[:TAGGED]-(post:Post)
                    WITH tag, views, post
                    ORDER BY post.views DESC
                    WITH tag, views, COLLECT(post)[0] as thumbnail
                    WITH COLLECT(tag {.*, views: views, img_url: thumbnail.img_url}) as taglist
                    RETURN taglist[0..5] as hashtags`,
  stats_top_posting = `MATCH (user:User)
                      WITH user
                      ORDER BY user.posting DESC
                      WITH COLLECT(user) AS userlist
                      RETURN userlist[$skip..$skip+$limit] AS users`,
}
