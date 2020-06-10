// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

// Serverless http
import * as serverless from 'serverless-http';
import * as Koa from 'koa';
import * as Router from 'koa-router';

// Koa 설정
const app = new Koa();
const router = new Router();
router.prefix('/users');

app.use(router.routes());
app.use(router.allowedMethods());

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// util 가져오기
import { createResponse, statusCode } from './modules/util';
import { getUserInfo } from './modules/cognito';
import { tx, Query, toNumber, toDateString } from './modules/neo4j';
import { User, UserNode, Post, PostNode } from './modules/neo4j/types';

/**
 * Route: /users
 * Method: get, delete
 */

/* 유저 정보 반환 */
router.get('/', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.get_user], [{ uid: user.username }]);
  console.log('results', results);

  // 서버에서 값이 안넘어올시 에러
  if (!results) {
    console.error('Database Result is null');
    return createResponse(
      ctx,
      statusCode.dataBaseError,
      null,
      'Database Result is null'
    );
  }
  const result = results[0];
  console.log('result', result);

  // 결과 파싱하여 넣기
  let res = {
    user: null as User | null,
  };
  result.records.forEach((r) => {
    console.log(r);

    // 유저 결과 가져오기
    const userNode: UserNode = r.get('user');
    console.log('userNode', userNode);
    if (userNode) {
      const user: User = userNode.properties;
      user.created_at = toDateString(user.created_at);
      user.updated_at = toDateString(user.updated_at);

      res.user = user;
    }
  });

  // 결과값 반환
  createResponse(ctx, statusCode.success, res);
});

/* 유저 삭제 */
router.delete('/', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.delete_user], [{ uid: user.username }]);
  console.log('results', results);

  // 서버에서 값이 안넘어올시 에러
  if (!results) {
    console.error('Database Result is null');
    return createResponse(
      ctx,
      statusCode.dataBaseError,
      null,
      'Database Result is null'
    );
  }
  const result = results[0];
  console.log('result', result);

  // 결과값 반환
  createResponse(ctx, statusCode.processingSuccess, null);
});

/**
 * Route: /users/heart
 * Method: get
 */

/* 유저의 찜 정보 반환 */
router.get('/heart', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.get_user_heart], [{ uid: user.username }]);
  console.log('results', results);

  // 서버에서 값이 안넘어올시 에러
  if (!results) {
    console.error('Database Result is null');
    return createResponse(
      ctx,
      statusCode.dataBaseError,
      null,
      'Database Result is null'
    );
  }
  const result = results[0];
  console.log('result', result);

  // 결과 파싱하여 넣기
  let res = {
    posts: [] as Post[],
  };
  result.records.forEach((r) => {
    console.log(r);

    // 유저 결과 가져오기
    const posts: PostNode[] = r.get('posts');
    console.log('posts', posts);
    if (posts) {
      posts.forEach((node) => {
        const post: Post = node.properties;
        post.date = toDateString(post.date);

        post.likes = toNumber(post.likes) || 0;

        res.posts.push(post);
      });
    }
  });

  // 결과값 반환
  createResponse(ctx, statusCode.success, res);
});

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
