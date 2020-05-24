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
import { createResponse, statusCode, isUndefined } from './modules/util';

// Cognito
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string,
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

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

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
    {
      Username: username,
      Password: password,
    }
  );
  const userData = {
    Username: username,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  const result: any = await new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: resolve,
      onFailure: reject,
      newPasswordRequired: resolve,
    });
  });

  const idToken = result.idToken.jwtToken;

  console.log(result.idToken);

  createResponse(ctx, statusCode.success, { idToken });
});

// Lambda로 내보내기
module.exports.handler = serverless(app, {
  basePath: process.env.API_VERSION,
  callbackWaitsForEmptyEventLoop: false,
});
