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
import { tx, Query, toNumber, int, isSections } from './modules/neo4j';
import {
  Post,
  Integer,
  Sections,
  RatedRelationship,
} from './modules/neo4j/types';
import { getUserInfo } from './modules/cognito';

/**
 * Route: /search
 * Method: get
 */

/* 테스트용 이미지 가져오기 */
router.get('/', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const location = ctx.request.query.location;
  const section: Sections = isSections(ctx.request.query.section)
    ? ctx.request.query.section
    : 'SEC_ALL';
  const limit = int(ctx.request.query.limit || 5);
  const skip = int(ctx.request.query.skip || 0);
  console.log({ location, section, limit, skip });

  // Cognito에서 유저 가져오기
  const user = getUserInfo(ctx);

  // 파라미터 오류 체크
  if (!location) {
    console.error('Query (location) is undefined');
    return createResponse(
      ctx,
      statusCode.requestError,
      null,
      'Query (location) is undefined'
    );
  }
  // 쿼리 보내기
  const results = await tx(
    [Query.search_with_hashtag],
    [{ hid: location, uid: user.username, section, limit, skip }]
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

  // 결과 파싱하여 넣기
  let res = {
    posts: [] as Post[],
    num: 0 as number,
  };
  result.records.forEach((r) => {
    console.log(r);

    // 게시글 결과 가져오기
    const postsNodes: Post[] = r.get('posts');
    console.log('postsNodes', postsNodes);
    if (postsNodes) {
      postsNodes.forEach((node) => {
        node.hearted = node.hearted ? true : false;
        node.rated = node.rated
          ? (node.rated as RatedRelationship).properties.rates
          : 0;

        node.date = node.date.toString();
        node.likes = toNumber(node.likes) || 0;

        res.posts.push(node);
      });
    }

    // 전체 게시물 개수 가져와서 JS 숫자로 변환
    const numValue: Integer = r.get('num');
    console.log('numValue', numValue);
    const num = toNumber(numValue);

    // 숫자가 JS로 표현이 불가능하면 에러
    if (num == null) {
      console.error('Result number is Invalid');
      return createResponse(
        ctx,
        statusCode.dataBaseError,
        null,
        'Result number is Invalid'
      );
    } else res.num = num;
  });

  // 결과값 반환
  createResponse(ctx, statusCode.success, res);
});

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
