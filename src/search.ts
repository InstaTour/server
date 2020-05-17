// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

// Serverless http
import * as serverless from 'serverless-http';
import * as Koa from 'koa';
// const bodyParser = require('koa-bodyparser');
import * as Router from 'koa-router';

// Koa 설정
const app = new Koa();
const router = new Router();
router.prefix('/search');

app.use(router.routes());
app.use(router.allowedMethods());

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// util 가져오기
import { createResponse, statusCode } from './modules/util';

// Neo4j 연결
import { tx, Query, Post } from './modules/neo4j';
import { int, Node } from 'neo4j-driver';

/**
 * Route: /search
 * Method: get
 */

/* 테스트용 이미지 가져오기 */
router.get('/', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const id = ctx.request.query.id;
  const limit = int(5);

  // 쿼리 보내기
  const results = await tx([Query.get_posts_with_hashtag], [{ id, limit }]);

  // 서버에서 값이 안넘어올시 에러
  if (!results) {
    return createResponse(
      ctx,
      statusCode.dataBaseError,
      null,
      'Database Result is null'
    );
  }

  // 결과 파싱하여 넣기
  let posts: any[] = [];
  for (const result of results) {
    result.records.forEach((r) => {
      console.log(r);

      const post: Post = r.get('post');
      posts.push(post.properties);
    });
  }

  // 결과값 반환
  createResponse(ctx, statusCode.success, { posts });
});

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
