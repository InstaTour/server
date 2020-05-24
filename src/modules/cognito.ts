import 'cross-fetch/polyfill';

import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
  CognitoIdToken,
} from 'amazon-cognito-identity-js';
import { ParameterizedContext } from 'koa';
export { CognitoUserPool, AuthenticationDetails, CognitoUser, CognitoIdToken };

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string,
};
export const userPool = new CognitoUserPool(poolData);

export function getUser(username: string) {
  return new CognitoUser({
    Username: username,
    Pool: userPool,
  });
}

export function getUserInfo(ctx: ParameterizedContext): UserInfo {
  const idToken = new CognitoIdToken({
    IdToken: ctx.request.header.authorization.replace('Bearer ', ''),
  });

  const { email, profile, nickname } = idToken.payload;
  const username = idToken.payload['cognito:username'];

  return { email, username, profile, nickname };
}

export interface UserInfo {
  profile: string;
  username: string;
  nickname: string;
  email: string;
}
