// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

// Serverless http
import * as serverless from 'serverless-http';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';

// Koa 설정
const app = new Koa();
const router = new Router();
router.prefix('/posts');

app.use(router.routes());
app.use(router.allowedMethods());

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// util 가져오기
import { createResponse, statusCode } from './modules/util';
import { getUserInfo } from './modules/cognito';
import { Query, tx, toNumber } from './modules/neo4j';
import { Sections, Post, PostNode } from './modules/neo4j/types';

/**
 * Route: /posts
 * Method: get, post
 */

/* 테스트용 이미지 가져오기 */
router.get('/', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  const posts = [
    'http://s3.instatour.tech/image56.png',
    'http://s3.instatour.tech/image57.png',
    'http://s3.instatour.tech/image58.png',
    'http://s3.instatour.tech/image59.png',
  ];

  createResponse(ctx, statusCode.success, { posts });
});

/* 게시글 업로드 */
router.post('/', bodyParser(), async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const location = ctx.request.body.location;
  let section: Sections = ctx.request.body.section || 'SEC_ALL';
  const img_url =
    ctx.request.body.img_url || 'https://s3.instatour.tech/blank.jpg';
  const content = ctx.request.body.content || '';
  console.log('[Parameter]', { location, img_url, content });

  // 파라미터 오류 체크
  if (!location) {
    console.error('Body (location) is undefined');
    return createResponse(
      ctx,
      statusCode.requestError,
      null,
      'Body (location) is undefined'
    );
  }

  // img_url의 배열 파싱
  const img_array = JSON.parse(img_url.replace(/'/g, '"'));

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 섹션 SEC_ALL은 TAGGED로 쿼리한다.
  if (section == 'SEC_ALL') {
    section = 'TAGGED';
  }

  // 쿼리 보내기
  const results = await tx(
    [Query.create_post_instatour],
    [
      {
        hid: location,
        uid: user.username,
        section,
        img_url: img_array,
        content,
      },
    ]
  );
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
    post: null as Post | null,
  };
  result.records.forEach((r) => {
    console.log(r);

    // 게시글 결과 가져오기
    const postsNode: PostNode = r.get('post');
    console.log('postsNode', postsNode);
    if (postsNode) {
      const post: Post = postsNode.properties;
      post.likes = toNumber(post.likes) || 0;
      post.rated = null;
      post.hearted = null;
      post.date = post.date.toString();

      res.post = post;
    }
  });

  // 결과값 반환
  createResponse(ctx, statusCode.success, res);
});

/**
 * Route: /posts/{pid}
 * Method: get
 */

/* 게시글 정보 가져오기 */
router.get('/:pid', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const pid = ctx.params.pid;
  console.log('[Parameter]', { pid });

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.get_post], [{ pid, uid: user.username }]);
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
    post: null as Post | null,
  };
  result.records.forEach((r) => {
    console.log(r);

    // 게시글 결과 가져오기
    const postsNode: PostNode = r.get('post');
    console.log('postsNode', postsNode);
    if (postsNode) {
      const post: Post = postsNode.properties;
      post.likes = toNumber(post.likes) || 0;
      post.rated = null;
      post.hearted = null;
      post.date = post.date.toString();

      res.post = post;
    }
  });

  // 결과값 반환
  createResponse(ctx, statusCode.success, res);
});

/**
 * Route: /posts/{pid}/heart
 * Method: post, delete
 */

/* 게시글 찜하기 */
router.post('/:pid/heart', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const pid = ctx.params.pid;
  console.log('[Parameter]', { pid });

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.heart_post], [{ pid, uid: user.username }]);
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

/* 게시글 찜 해제하기 */
router.delete('/:pid/heart', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const pid = ctx.params.pid;
  console.log('[Parameter]', { pid });

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.delete_heart], [{ pid, uid: user.username }]);
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
 * Route: /posts/{pid}/rates
 * Method: put, delete
 */

/* 게시글에 별점주기 */
router.put('/:pid/rates', bodyParser(), async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const pid = ctx.params.pid;
  const rates = Number(ctx.request.body.rates);
  console.log('[Parameter]', { pid, rates });

  // 파라미터 오류 체크
  if (!rates) {
    console.error('Body (rates) is undefined');
    return createResponse(
      ctx,
      statusCode.requestError,
      null,
      'Body (rate) is undefined'
    );
  }

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx(
    [Query.rates_post],
    [{ pid, uid: user.username, rates }]
  );
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

/* 게시글에 별점 삭제 */
router.delete('/:pid/rates', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const pid = ctx.params.pid;
  console.log('[Parameter]', { pid });

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 쿼리 보내기
  const results = await tx([Query.delete_rate], [{ pid, uid: user.username }]);
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

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
