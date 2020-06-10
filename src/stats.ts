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
router.prefix('/stats');

app.use(router.routes());
app.use(router.allowedMethods());

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// util 가져오기
import { createResponse, statusCode } from './modules/util';
import { getUserInfo } from './modules/cognito';
import { tx, Query, int, toNumber, toDateString } from './modules/neo4j';
import { Post } from './modules/neo4j/types';

/**
 * Route: /stats/clcik
 * Method: get
 */

/* n일간 탑 클릭 통계 */
router.get('/click', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 파라미터 가져오기
  const date = int(ctx.request.query.date || 0).negate();
  const limit = int(ctx.request.query.limit || 5);
  const skip = int(ctx.request.query.skip || 0);
  console.log({ date, limit, skip });

  // 쿼리 보내기
  const results = await tx([Query.stats_top_click], [{ date, limit, skip }]);
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

    // 게시글 결과 가져오기
    const postsNodes: Post[] = r.get('posts');
    console.log('postsNodes', postsNodes);
    if (postsNodes) {
      postsNodes.forEach((node) => {
        node.date = toDateString(node.date);
        node.views = toNumber(node.views) || 0;
        node.likes = toNumber(node.likes) || 0;

        res.posts.push(node);
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
