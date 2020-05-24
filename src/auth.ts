// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

// Serverless http
import * as serverless from 'serverless-http';
import * as Koa from 'koa';

// const bodyParser = require('koa-bodyparser');
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';

// Koa 설정
const app = new Koa();
const router = new Router();
router.prefix('/auth');

app.use(router.routes());
app.use(router.allowedMethods());

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// util 가져오기
import { createResponse, statusCode } from './modules/util';
import { AuthenticationDetails, getUser } from './modules/cognito';

// Cognito
/**
 * Route: /auth
 * Method: post
 */

/* 테스트용 IdToken 가져오기 */
router.post('/', bodyParser(), async (ctx) => {
  // 함수 호출위치 로그
  console.log(ctx.request.url, ctx.request.method);

  // 파라미터 가져오기
  const username = ctx.request.body.username;
  const password = ctx.request.body.password;

  if (!username) {
    return createResponse(
      ctx,
      statusCode.requestError,
      null,
      'username이 없습니다.'
    );
  }
  if (!password) {
    return createResponse(
      ctx,
      statusCode.requestError,
      null,
      'password가 없습니다.'
    );
  }

  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const cognitoUser = getUser(username);

  const result: any = await new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: resolve,
      onFailure: reject,
      newPasswordRequired: resolve,
    });
  });
  console.log('result', result);

  const idToken = result.idToken.jwtToken;

  createResponse(ctx, statusCode.success, { idToken });
});

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
