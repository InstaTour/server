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
router.prefix('/posts');

app.use(router.routes());
app.use(router.allowedMethods());

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// util 가져오기
import { createResponse, statusCode } from './modules/util';

/**
 * Route: /posts
 * Method: get
 */

/* 테스트용 이미지 가져오기 */
router.get('/', async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  const posts = [
    'http://s3.instatour.tech/image+(56).png',
    'http://s3.instatour.tech/image+(57).png',
    'http://s3.instatour.tech/image+(58).png',
    'http://s3.instatour.tech/image+(59).png',
  ];

  createResponse(ctx, statusCode.success, { posts });
});

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
