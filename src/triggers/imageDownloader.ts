// dotenv fetch
import * as dotenv from 'dotenv';
dotenv.config();

import { Context, Callback } from 'aws-lambda';

// AWS xray 연결
import * as rawAWS from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';
const awsSdk = captureAWS(rawAWS);

// https
import axios from 'axios';
import * as stream from 'stream';
const s3 = new awsSdk.S3();

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

async function imageToS3(url: string, filename: string) {
  let contentType = 'application/octet-stream';
  let promise: Promise<rawAWS.S3.ManagedUpload.SendData> | null = null;

  const uploadStream = () => {
    const pass = new stream.PassThrough();
    promise = s3
      .upload({
        Bucket: process.env.S3_BUCKET as string,
        Key: `${process.env.STAGE as string}/${filename}.jpg`,
        Body: pass,
        ACL: 'public-read',
        ContentType: contentType,
      })
      .promise();
    return pass;
  };

  const imageRequest = axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  }).then((response) => {
    console.log('STREAM.then', response);
    if (response.status === 200) {
      contentType = response.headers['content-type'];
      response.data.pipe(uploadStream());
    }
  });
}

exports.handler = async (event: any, context: Context, callback: Callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  for (const record of event.Records) {
    console.log('Stream record: ', JSON.stringify(record, null, 2));

    // 새 이미지 파싱
    const obj = parse(record.dynamodb.NewImage);
    console.log('obj', obj);

    // 키 분리
    const key = obj.key;

    if (record.eventName == 'INSERT' || record.eventName == 'MODIFY') {
      // 이미지 주소 분리
      const img_url = obj.img_url;

      // S3에 이미지주소에서 다운받은 이미지 저장
      await imageToS3(img_url, key);
    } else if (record.eventName == 'REMOVE') {
      // 존재하는 이미지 삭제
      const result = await s3
        .deleteObject({
          Bucket: process.env.S3_BUCKET as string,
          Key: `${process.env.STAGE as string}/${key}.jpg`,
        })
        .promise();

      console.log('[REMOVE]', result);
    }
  }

  console.log(`Before callback ${event.Records.length} records.`);
  callback(null, `Successfully processed ${event.Records.length} records.`);
};
