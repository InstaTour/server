import { Context, Callback } from 'aws-lambda';
import { Query, tx } from '../modules/neo4j';

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

exports.handler = async (event: any, context: Context, callback: Callback) => {
  // 자동 인증
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true; // this is NOT needed if e-mail is not in attributeList
  //event.response.autoVerifyPhone = true; // this is NOT needed if phone # is not in attributeList

  let params = {
    ...event.request.userAttributes,
    uid: event.userName,
  };

  await tx([Query.create_user], [params]);

  context.done(undefined, event);
};
