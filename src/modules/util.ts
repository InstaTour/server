// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

import { ParameterizedContext } from 'koa';

export function createResponse(
  ctx: ParameterizedContext,
  status: statusCode,
  body: Object | null,
  err: String | null = null
) {
  ctx.status = 200;
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Credentials', 'true');
  ctx.body = {
    code: status,
    message: err,
    data: body,
  };
}

export const enum statusCode {
  success = 200, // 성공 (서버에서 요청한 값 반환)
  secondSuccess = 201, // 성공 (서버에 새로운 값 작성)
  processingSuccess = 204, // 성공 (반환값이 없음)
  requestError = 400, // 실패 (서버에서 요청을 이해 못함)
  authenticationFailure = 401, // 권한필요
  authorizationFailure = 403, // 접근불가
  failure = 404, // 실패 (서버에서 요청한 값을 찾을 수 없음)
  serverError = 500, // 서버 내부에서 에러 발생
  dataBaseError = 600, // DB에서 에러 발생
}
