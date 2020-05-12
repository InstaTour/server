// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

import { Context, Callback } from 'aws-lambda';
import { tx, Query } from '../modules/neo4j';

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

function parse(obj: Object): any {
  let result = {};
  const keys = Object.keys(obj);
  for (const key in obj) {
    if ('S' in obj[key]) {
      result[key] = obj[key].S;
    } else if ('N' in obj[key]) {
      result[key] = Number(obj[key].N);
    } else if ('L' in obj[key]) {
      result[key] = [];
      for (const item of obj[key].L) {
        if ('S' in item) {
          result[key].push(item.S);
        } else if ('N' in item) {
          result[key].push(Number(item.N));
        }
      }
    }
  }
  return result;
}

exports.handler = async (event: any, context: Context, callback: Callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  for (const record of event.Records) {
    console.log('Stream record: ', JSON.stringify(record, null, 2));

    const img = parse(record.dynamodb.NewImage);
    console.log('img', img);

    // 키 분리
    const key = img.key;

    // 해시태그 분리와 유저이름 삭제
    const hashtags = img.hashtags;
    delete img.hashtags;
    delete img.username;

    let querys: Query[] = [];
    let params: Object[] = [];

    // 이미지 S3로 연결
    img.img_url = process.env.S3_URL + key + '.jpg';

    // 새로 추가시
    if (record.eventName == 'INSERT') {
      querys.push(Query.create_post_instagram);
      params.push(img);
    }
    // 수정시
    else if (record.eventName == 'MODIFY') {
      delete img.key;

      querys.push(Query.update_post);
      params.push({
        id: key,
        keys: Object.keys(img),
        values: Object.values(img),
      });
    }

    for (const hashtag of hashtags) {
      querys.push(Query.post_hashtag_relation);
      params.push({
        pid: key,
        tid: hashtag,
      });
    }

    await tx(querys, params);
  }

  console.log(`Before callback ${event.Records.length} records.`);
  return callback(
    null,
    `Successfully processed ${event.Records.length} records.`
  );
};
